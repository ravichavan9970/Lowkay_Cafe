package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "food_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private FoodCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private KitchenStation station;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 500)
    private String imageUrl;

    @Builder.Default
    private Boolean isVeg = true;

    @Builder.Default
    private Boolean isVegan = false;

    @Builder.Default
    private Boolean isGlutenFree = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(length = 20)
    private SpiceLevel spiceLevel = SpiceLevel.MEDIUM;

    @Builder.Default
    private Integer prepTimeMinutes = 15;

    private String allergyInfo; // e.g. "Contains Dairy, Nuts"

    @Column(columnDefinition = "TEXT")
    private String ingredients;

    @Builder.Default
    private Boolean isAvailable = true;

    @Builder.Default
    private Boolean isPopular = false;

    @Builder.Default
    private Boolean isSpecialOffer = false;

    @Column(precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Builder.Default
    @OneToMany(mappedBy = "foodItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FoodCustomization> customizations = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
