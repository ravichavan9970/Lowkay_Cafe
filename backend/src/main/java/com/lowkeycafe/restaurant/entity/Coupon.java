package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    private LocalDateTime validUntil;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Integer usageLimit = 1000;

    @Builder.Default
    private Integer timesUsed = 0;
}
