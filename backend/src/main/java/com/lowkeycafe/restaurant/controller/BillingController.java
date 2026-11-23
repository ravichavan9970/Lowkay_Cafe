package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.BillingDto;
import com.lowkeycafe.restaurant.entity.Bill;
import com.lowkeycafe.restaurant.entity.Payment;
import com.lowkeycafe.restaurant.repository.BillRepository;
import com.lowkeycafe.restaurant.service.BillingService;
import com.lowkeycafe.restaurant.service.EmailReceiptService;
import com.lowkeycafe.restaurant.service.PdfReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final PdfReceiptService pdfReceiptService;
    private final EmailReceiptService emailReceiptService;
    private final BillRepository billRepository;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<BillingDto.BillResponse> getBillForOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(billingService.getOrCreateBillForOrder(orderId));
    }

    @PostMapping("/{billId}/tip")
    public ResponseEntity<BillingDto.BillResponse> applyTip(
            @PathVariable Long billId,
            @RequestBody BillingDto.TipRequest request) {
        return ResponseEntity.ok(billingService.applyTip(billId, request));
    }

    @PostMapping("/{billId}/split")
    public ResponseEntity<BillingDto.BillResponse> splitBill(
            @PathVariable Long billId,
            @RequestBody BillingDto.SplitBillRequest request) {
        return ResponseEntity.ok(billingService.splitBill(billId, request));
    }

    @PostMapping("/pay/initiate")
    public ResponseEntity<Payment> initiatePayment(@RequestBody BillingDto.PaymentInitiateRequest request) {
        return ResponseEntity.ok(billingService.initiatePayment(request));
    }

    @PostMapping("/pay/verify")
    public ResponseEntity<BillingDto.BillResponse> verifyPayment(@RequestBody BillingDto.PaymentVerifyRequest request) {
        return ResponseEntity.ok(billingService.verifyPayment(request));
    }

    @PostMapping("/pay/cash")
    public ResponseEntity<BillingDto.BillResponse> recordCashPayment(@RequestBody BillingDto.CashPaymentRequest request) {
        return ResponseEntity.ok(billingService.recordCashPayment(request));
    }

    @GetMapping("/{billId}/receipt/pdf")
    public ResponseEntity<byte[]> downloadReceiptPdf(@PathVariable Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        byte[] pdf = pdfReceiptService.generateReceiptPdf(bill);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Receipt-" + bill.getBillNumber() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/{billId}/receipt/email")
    public ResponseEntity<?> emailReceipt(
            @PathVariable Long billId,
            @RequestBody Map<String, String> request) {
        String email = request.get("email");
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));

        boolean sent = emailReceiptService.sendReceiptEmail(bill, email);
        return ResponseEntity.ok(Map.of("sent", sent, "email", email));
    }
}
