package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "food_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 100)
    private String name; // Starters, Main Course, Fast Food, Pizza, Burgers, Beverages, Desserts, Special Offers

    @Column(nullable = false, length = 100)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String iconName;

    @Column(length = 500)
    private String imageUrl;

    @Builder.Default
    private Integer displayOrder = 1;

    @Builder.Default
    private Boolean isActive = true;
}
