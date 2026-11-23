package com.lowkeycafe.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_item_customizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemCustomization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    private Long optionId;

    private String groupName;

    @Column(nullable = false, length = 100)
    private String optionName;

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal additionalPrice = BigDecimal.ZERO;
}
