package com.lowkeycafe.restaurant.dto;

import com.lowkeycafe.restaurant.entity.BillStatus;
import com.lowkeycafe.restaurant.entity.PaymentMethod;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BillingDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillResponse {
        private Long id;
        private String billNumber;
        private Integer tableNumber;
        private Long orderId;
        private String orderCode;
        private BigDecimal subtotal;
        private BigDecimal taxAmount;
        private BigDecimal serviceCharge;
        private BigDecimal discountAmount;
        private BigDecimal tipAmount;
        private BigDecimal loyaltyDiscount;
        private BigDecimal finalPayableAmount;
        private BigDecimal paidAmount;
        private BillStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime paidAt;
        private List<BillItemDto> items;
        private List<BillSplitDto> splits;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillItemDto {
        private Long id;
        private String itemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillSplitDto {
        private Long id;
        private Integer splitNumber;
        private String splitType; // EQUAL, BY_ITEM, CUSTOM_AMOUNT
        private BigDecimal allocatedAmount;
        private Boolean isPaid;
        private String payerName;
        private String paymentMethod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SplitBillRequest {
        private String splitType; // EQUAL, CUSTOM_AMOUNT
        private Integer numberOfPersons;
        private List<BigDecimal> customAmounts;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TipRequest {
        private String tipType; // PERCENTAGE, CUSTOM, NONE
        private BigDecimal percentageValue;
        private BigDecimal customTipAmount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentInitiateRequest {
        private Long billId;
        private BigDecimal amount;
        private PaymentMethod paymentMethod;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentVerifyRequest {
        private String paymentReference;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CashPaymentRequest {
        private Long billId;
        private BigDecimal amount;
        private Long staffUserId;
    }
}
