package com.lowkeycafe.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "customization_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomizationOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customization_id", nullable = false)
    private FoodCustomization customization;

    @Column(nullable = false, length = 100)
    private String name; // Regular, Large, Extra Cheese, Jalapenos, Oat Milk

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal additionalPrice = BigDecimal.ZERO;

    @Builder.Default
    private Boolean isDefault = false;

    @Builder.Default
    private Integer displayOrder = 1;
}
