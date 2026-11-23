package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kitchen_stations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 100)
    private String name; // Main Kitchen, Pizza Station, Beverage Station, Dessert Station

    private String description;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Integer displayOrder = 1;
}
