package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_tables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, unique = true)
    private Integer tableNumber;

    @Builder.Default
    @Column(nullable = false)
    private Integer seatingCapacity = 4;

    @Builder.Default
    private String floorZone = "Main Dining";

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE"; // AVAILABLE, OCCUPIED, ORDERING, ORDER_RECEIVED, PREPARING, FOOD_READY, ASSISTANCE_REQUESTED, BILLING_REQUESTED

    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
