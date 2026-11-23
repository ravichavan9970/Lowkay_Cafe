package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String orderCode; // ORD-2026-XXXX

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private CustomerProfile customer;

    @Builder.Default
    @Column(length = 150)
    private String customerName = "Guest Diner";

    @Column(length = 30)
    private String customerPhone;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.NEW_ORDER;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal serviceCharge = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    private String appliedCouponCode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal grandTotal;

    @Column(columnDefinition = "TEXT")
    private String specialInstructions;

    @Builder.Default
    private Integer estimatedPrepMinutes = 20;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime acceptedAt;
    private LocalDateTime preparingAt;
    private LocalDateTime readyAt;
    private LocalDateTime servedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}
