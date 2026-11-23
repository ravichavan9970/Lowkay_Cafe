package com.lowkeycafe.restaurant.dto;

import com.lowkeycafe.restaurant.entity.SpiceLevel;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

public class MenuDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryResponse {
        private Long id;
        private String name;
        private String slug;
        private String description;
        private String iconName;
        private String imageUrl;
        private Integer displayOrder;
        private Boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FoodItemResponse {
        private Long id;
        private Long categoryId;
        private String categoryName;
        private Long stationId;
        private String stationName;
        private String name;
        private String description;
        private BigDecimal price;
        private String imageUrl;
        private Boolean isVeg;
        private Boolean isVegan;
        private Boolean isGlutenFree;
        private SpiceLevel spiceLevel;
        private Integer prepTimeMinutes;
        private String allergyInfo;
        private String ingredients;
        private Boolean isAvailable;
        private Boolean isPopular;
        private Boolean isSpecialOffer;
        private BigDecimal originalPrice;
        private List<CustomizationGroupResponse> customizations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CustomizationGroupResponse {
        private Long id;
        private String groupName;
        private Boolean isRequired;
        private Boolean allowMultiple;
        private List<OptionResponse> options;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OptionResponse {
        private Long id;
        private String name;
        private BigDecimal additionalPrice;
        private Boolean isDefault;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateFoodItemRequest {
        private Long categoryId;
        private Long stationId;
        private String name;
        private String description;
        private BigDecimal price;
        private String imageUrl;
        private Boolean isVeg;
        private Boolean isVegan;
        private Boolean isGlutenFree;
        private SpiceLevel spiceLevel;
        private Integer prepTimeMinutes;
        private String allergyInfo;
        private String ingredients;
        private Boolean isAvailable;
        private Boolean isPopular;
        private Boolean isSpecialOffer;
        private BigDecimal originalPrice;
    }
}
