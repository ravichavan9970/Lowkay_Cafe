package com.lowkeycafe.restaurant.dto;

import lombok.*;

import java.time.LocalDateTime;

public class ReviewDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateReviewRequest {
        private String orderCode;
        private Integer foodRating;
        private Integer serviceRating;
        private Integer cleanlinessRating;
        private Integer overallRating;
        private String comment;
        private String customerPhone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewResponse {
        private Long id;
        private String orderCode;
        private String customerName;
        private Integer foodRating;
        private Integer serviceRating;
        private Integer cleanlinessRating;
        private Integer overallRating;
        private String comment;
        private LocalDateTime createdAt;
    }
}
