package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.BillingDto;
import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final BillRepository billRepository;
    private final BillItemRepository billItemRepository;
    private final BillSplitRepository billSplitRepository;
    private final TipRepository tipRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final OrderRepository orderRepository;
    private final ReceiptRepository receiptRepository;
    private final RestaurantTableRepository tableRepository;
    private final LoyaltyService loyaltyService;
    private final NotificationService notificationService;

    @Value("${app.razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret}")
    private String razorpayKeySecret;

    @Transactional
    public BillingDto.BillResponse getOrCreateBillForOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        Bill bill = billRepository.findByOrderId(orderId).orElseGet(() -> {
            String billNumber = "BILL-" + System.currentTimeMillis() % 1000000;
            Bill newBill = Bill.builder()
                    .billNumber(billNumber)
                    .table(order.getTable())
                    .order(order)
                    .subtotal(order.getSubtotal())
                    .taxAmount(order.getTaxAmount())
                    .serviceCharge(order.getServiceCharge())
                    .discountAmount(order.getDiscountAmount())
                    .tipAmount(BigDecimal.ZERO)
                    .loyaltyDiscount(BigDecimal.ZERO)
                    .finalPayableAmount(order.getGrandTotal())
                    .paidAmount(BigDecimal.ZERO)
                    .status(BillStatus.UNPAID)
                    .createdAt(LocalDateTime.now())
                    .items(new ArrayList<>())
                    .splits(new ArrayList<>())
                    .build();
            newBill = billRepository.save(newBill);

            for (OrderItem oi : order.getItems()) {
                BillItem bi = BillItem.builder()
                        .bill(newBill)
                        .orderItem(oi)
                        .itemName(oi.getFoodItem().getName())
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .totalPrice(oi.getSubtotal())
                        .build();
                billItemRepository.save(bi);
                newBill.getItems().add(bi);
            }
            return newBill;
        });

        // Set table to BILLING_REQUESTED if not yet paid
        if (bill.getStatus() != BillStatus.PAID && order.getTable() != null) {
            order.getTable().setStatus("BILLING_REQUESTED");
            tableRepository.save(order.getTable());
            notificationService.notifyTableUpdate(order.getTable());
        }

        return mapBillToDto(bill);
    }

    @Transactional
    public BillingDto.BillResponse applyTip(Long billId, BillingDto.TipRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        if (bill.getStatus() == BillStatus.PAID) {
            throw new IllegalStateException("Bill is already paid");
        }

        BigDecimal tipAmount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(request.getTipType()) && request.getPercentageValue() != null) {
            tipAmount = bill.getSubtotal().multiply(request.getPercentageValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if ("CUSTOM".equalsIgnoreCase(request.getTipType()) && request.getCustomTipAmount() != null) {
            tipAmount = request.getCustomTipAmount();
        }

        bill.setTipAmount(tipAmount);
        BigDecimal newFinal = bill.getSubtotal()
                .subtract(bill.getDiscountAmount() != null ? bill.getDiscountAmount() : BigDecimal.ZERO)
                .subtract(bill.getLoyaltyDiscount() != null ? bill.getLoyaltyDiscount() : BigDecimal.ZERO)
                .add(bill.getTaxAmount())
                .add(bill.getServiceCharge())
                .add(tipAmount);
        bill.setFinalPayableAmount(newFinal);

        Tip tip = Tip.builder()
                .bill(bill)
                .tipType(request.getTipType() != null ? request.getTipType() : "NONE")
                .percentageValue(request.getPercentageValue())
                .tipAmount(tipAmount)
                .build();
        tipRepository.save(tip);

        bill = billRepository.save(bill);
        return mapBillToDto(bill);
    }

    @Transactional
    public BillingDto.BillResponse splitBill(Long billId, BillingDto.SplitBillRequest request) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        billSplitRepository.deleteAll(bill.getSplits());
        bill.getSplits().clear();

        List<BillSplit> newSplits = new ArrayList<>();
        BigDecimal total = bill.getFinalPayableAmount();

        if ("EQUAL".equalsIgnoreCase(request.getSplitType())) {
            int numPersons = Math.max(1, request.getNumberOfPersons() != null ? request.getNumberOfPersons() : 2);
            BigDecimal equalShare = total.divide(BigDecimal.valueOf(numPersons), 2, RoundingMode.HALF_UP);
            BigDecimal runningSum = BigDecimal.ZERO;

            for (int i = 1; i <= numPersons; i++) {
                BigDecimal share = (i == numPersons) ? total.subtract(runningSum) : equalShare;
                runningSum = runningSum.add(share);

                BillSplit split = BillSplit.builder()
                        .bill(bill)
                        .splitNumber(i)
                        .splitType("EQUAL")
                        .allocatedAmount(share)
                        .isPaid(false)
                        .payerName("Person " + i)
                        .build();
                newSplits.add(billSplitRepository.save(split));
            }
        } else if ("CUSTOM_AMOUNT".equalsIgnoreCase(request.getSplitType()) && request.getCustomAmounts() != null) {
            BigDecimal sum = request.getCustomAmounts().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            if (sum.compareTo(total) != 0) {
                throw new IllegalArgumentException("Sum of split amounts (" + sum + ") must equal final bill amount (" + total + ")");
            }

            int index = 1;
            for (BigDecimal amt : request.getCustomAmounts()) {
                BillSplit split = BillSplit.builder()
                        .bill(bill)
                        .splitNumber(index)
                        .splitType("CUSTOM_AMOUNT")
                        .allocatedAmount(amt)
                        .isPaid(false)
                        .payerName("Person " + index)
                        .build();
                newSplits.add(billSplitRepository.save(split));
                index++;
            }
        }

        bill.setSplits(newSplits);
        return mapBillToDto(bill);
    }

    @Transactional
    public Payment initiatePayment(BillingDto.PaymentInitiateRequest request) {
        Bill bill = billRepository.findById(request.getBillId())
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + request.getBillId()));

        String payRef = "PAY-" + System.currentTimeMillis() % 1000000;
        String mockRazorpayOrderId = "order_mock_" + UUID.randomUUID().toString().substring(0, 8);

        Payment payment = Payment.builder()
                .paymentReference(payRef)
                .bill(bill)
                .amount(request.getAmount() != null ? request.getAmount() : bill.getFinalPayableAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.PENDING)
                .gatewayOrderId(mockRazorpayOrderId)
                .createdAt(LocalDateTime.now())
                .build();

        payment = paymentRepository.save(payment);

        PaymentTransaction tx = PaymentTransaction.builder()
                .payment(payment)
                .transactionCode("TX-" + UUID.randomUUID().toString().substring(0, 8))
                .gatewayName("RAZORPAY")
                .payloadRequest("Initiate payment for ₹" + payment.getAmount() + " via " + request.getPaymentMethod())
                .status("INITIATED")
                .build();
        paymentTransactionRepository.save(tx);

        return payment;
    }

    @Transactional
    public BillingDto.BillResponse verifyPayment(BillingDto.PaymentVerifyRequest request) {
        Payment payment = paymentRepository.findByPaymentReference(request.getPaymentReference())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found: " + request.getPaymentReference()));

        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return mapBillToDto(payment.getBill());
        }

        // Server-side signature validation
        boolean isValidSignature = true;
        if (request.getRazorpaySignature() != null && !request.getRazorpaySignature().isBlank()
                && !razorpayKeySecret.startsWith("dummy")) {
            isValidSignature = verifyHmacSha256(
                    request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                    request.getRazorpaySignature(),
                    razorpayKeySecret
            );
        }

        if (!isValidSignature) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new SecurityException("Payment verification signature mismatch! Payment rejected.");
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setGatewayPaymentId(request.getRazorpayPaymentId());
        payment.setGatewaySignature(request.getRazorpaySignature());
        payment.setVerifiedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Update Bill
        Bill bill = payment.getBill();
        bill.setPaidAmount(bill.getPaidAmount().add(payment.getAmount()));
        if (bill.getPaidAmount().compareTo(bill.getFinalPayableAmount()) >= 0) {
            bill.setStatus(BillStatus.PAID);
            bill.setPaidAt(LocalDateTime.now());

            // Update Order status
            Order order = bill.getOrder();
            if (order != null) {
                order.setStatus(OrderStatus.COMPLETED);
                order.setCompletedAt(LocalDateTime.now());
                orderRepository.save(order);

                // Award loyalty points to customer
                if (order.getCustomer() != null) {
                    loyaltyService.awardPoints(order.getCustomer().getId(), order.getId(), bill.getFinalPayableAmount());
                }
            }

            // Free table
            RestaurantTable table = bill.getTable();
            if (table != null) {
                table.setStatus("AVAILABLE");
                tableRepository.save(table);
                notificationService.notifyTableUpdate(table);
            }

            // Generate receipt entity
            Receipt receipt = Receipt.builder()
                    .receiptNumber("REC-" + bill.getBillNumber())
                    .bill(bill)
                    .generatedAt(LocalDateTime.now())
                    .build();
            receiptRepository.save(receipt);

            notificationService.saveAndBroadcastNotification(
                    "ADMIN",
                    "Payment Received for " + bill.getBillNumber(),
                    "Table #" + (table != null ? table.getTableNumber() : "N/A") + " paid ₹" + bill.getFinalPayableAmount(),
                    "PAYMENT_DONE",
                    bill.getId()
            );
        } else {
            bill.setStatus(BillStatus.PARTIALLY_PAID);
        }

        bill = billRepository.save(bill);
        BillingDto.BillResponse response = mapBillToDto(bill);
        notificationService.notifyTableUpdate(bill.getTable());
        return response;
    }

    @Transactional
    public BillingDto.BillResponse recordCashPayment(BillingDto.CashPaymentRequest request) {
        Bill bill = billRepository.findById(request.getBillId())
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + request.getBillId()));

        String payRef = "CASH-" + System.currentTimeMillis() % 1000000;
        Payment payment = Payment.builder()
                .paymentReference(payRef)
                .bill(bill)
                .amount(request.getAmount() != null ? request.getAmount() : bill.getFinalPayableAmount())
                .paymentMethod(PaymentMethod.CASH)
                .status(PaymentStatus.COMPLETED)
                .verifiedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        bill.setPaidAmount(bill.getPaidAmount().add(payment.getAmount()));
        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(LocalDateTime.now());

        Order order = bill.getOrder();
        if (order != null) {
            order.setStatus(OrderStatus.COMPLETED);
            order.setCompletedAt(LocalDateTime.now());
            orderRepository.save(order);
        }

        RestaurantTable table = bill.getTable();
        if (table != null) {
            table.setStatus("AVAILABLE");
            tableRepository.save(table);
            notificationService.notifyTableUpdate(table);
        }

        Receipt receipt = Receipt.builder()
                .receiptNumber("REC-" + bill.getBillNumber())
                .bill(bill)
                .generatedAt(LocalDateTime.now())
                .build();
        receiptRepository.save(receipt);

        bill = billRepository.save(bill);
        return mapBillToDto(bill);
    }

    private boolean verifyHmacSha256(String data, String signature, String secret) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("HMAC verification error: {}", e.getMessage());
            return false;
        }
    }

    public BillingDto.BillResponse mapBillToDto(Bill bill) {
        List<BillingDto.BillItemDto> itemDtos = bill.getItems().stream()
                .map(bi -> BillingDto.BillItemDto.builder()
                        .id(bi.getId())
                        .itemName(bi.getItemName())
                        .quantity(bi.getQuantity())
                        .unitPrice(bi.getUnitPrice())
                        .totalPrice(bi.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        List<BillingDto.BillSplitDto> splitDtos = bill.getSplits().stream()
                .map(s -> BillingDto.BillSplitDto.builder()
                        .id(s.getId())
                        .splitNumber(s.getSplitNumber())
                        .splitType(s.getSplitType())
                        .allocatedAmount(s.getAllocatedAmount())
                        .isPaid(s.getIsPaid())
                        .payerName(s.getPayerName())
                        .paymentMethod(s.getPaymentMethod())
                        .build())
                .collect(Collectors.toList());

        return BillingDto.BillResponse.builder()
                .id(bill.getId())
                .billNumber(bill.getBillNumber())
                .tableNumber(bill.getTable() != null ? bill.getTable().getTableNumber() : null)
                .orderId(bill.getOrder() != null ? bill.getOrder().getId() : null)
                .orderCode(bill.getOrder() != null ? bill.getOrder().getOrderCode() : null)
                .subtotal(bill.getSubtotal())
                .taxAmount(bill.getTaxAmount())
                .serviceCharge(bill.getServiceCharge())
                .discountAmount(bill.getDiscountAmount())
                .tipAmount(bill.getTipAmount())
                .loyaltyDiscount(bill.getLoyaltyDiscount())
                .finalPayableAmount(bill.getFinalPayableAmount())
                .paidAmount(bill.getPaidAmount())
                .status(bill.getStatus())
                .createdAt(bill.getCreatedAt())
                .paidAt(bill.getPaidAt())
                .items(itemDtos)
                .splits(splitDtos)
                .build();
    }
}
