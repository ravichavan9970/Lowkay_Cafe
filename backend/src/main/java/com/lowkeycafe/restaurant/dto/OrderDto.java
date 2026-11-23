package com.lowkeycafe.restaurant.dto;

import com.lowkeycafe.restaurant.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOrderRequest {
        private Integer tableNumber;
        private String customerName;
        private String customerPhone;
        private String specialInstructions;
        private String couponCode;
        private List<CreateOrderItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateOrderItemRequest {
        private Long foodItemId;
        private Integer quantity;
        private String selectedPortion;
        private String selectedSpiceLevel;
        private String removedIngredients;
        private String itemNotes;
        private List<SelectedCustomizationRequest> customizations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SelectedCustomizationRequest {
        private Long optionId;
        private String groupName;
        private String optionName;
        private BigDecimal additionalPrice;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderResponse {
        private Long id;
        private String orderCode;
        private Integer tableNumber;
        private String customerName;
        private String customerPhone;
        private OrderStatus status;
        private BigDecimal subtotal;
        private BigDecimal taxAmount;
        private BigDecimal serviceCharge;
        private BigDecimal discountAmount;
        private String appliedCouponCode;
        private BigDecimal grandTotal;
        private String specialInstructions;
        private Integer estimatedPrepMinutes;
        private LocalDateTime createdAt;
        private LocalDateTime acceptedAt;
        private LocalDateTime preparingAt;
        private LocalDateTime readyAt;
        private LocalDateTime servedAt;
        private List<OrderItemResponse> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long foodItemId;
        private String foodItemName;
        private String foodItemImage;
        private String categoryName;
        private Long stationId;
        private String stationName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String selectedPortion;
        private String selectedSpiceLevel;
        private String removedIngredients;
        private String itemNotes;
        private String allergyInfo;
        private String status;
        private List<SelectedCustomizationRequest> customizations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private OrderStatus status;
        private String reason;
    }
}
