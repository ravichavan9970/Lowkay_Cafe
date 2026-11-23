package com.lowkeycafe.restaurant.dto;

import lombok.*;

public class TableDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TableResponse {
        private Long id;
        private Integer tableNumber;
        private Integer seatingCapacity;
        private String floorZone;
        private String status;
        private Boolean isActive;
        private String accessToken;
        private String qrTargetUrl;
        private String qrImageData;
        private Long activeOrderId;
        private String activeOrderCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTableRequest {
        private Integer tableNumber;
        private Integer seatingCapacity;
        private String floorZone;
    }
}
