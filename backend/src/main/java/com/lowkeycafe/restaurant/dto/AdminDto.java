package com.lowkeycafe.restaurant.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class AdminDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardStats {
        private Long totalTables;
        private Long availableTables;
        private Long occupiedTables;
        private Long activeOrders;
        private Long pendingKitchenOrders;
        private Long readyOrders;
        private Long pendingWaiterRequests;
        private BigDecimal todaySales;
        private Long todayCompletedOrders;
        private Double avgCustomerRating;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesAnalytics {
        private BigDecimal dailyRevenue;
        private BigDecimal weeklyRevenue;
        private BigDecimal monthlyRevenue;
        private List<TopItemDto> topSellingItems;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopItemDto {
        private String itemName;
        private Long quantitySold;
        private BigDecimal revenue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SettingsDto {
        private String restaurantName;
        private String tagline;
        private String address;
        private String phone;
        private String email;
        private String wifiName;
        private String wifiPassword;
        private BigDecimal taxPercentage;
        private BigDecimal serviceChargePercentage;
        private String currency;
        private String currencySymbol;
        private String openingTime;
        private String closingTime;
        private BigDecimal pointsPerHundred;
        private BigDecimal pointValueRatio;
        private Boolean paymentGatewayEnabled;
        private Boolean autoAcceptOrders;
    }
}
