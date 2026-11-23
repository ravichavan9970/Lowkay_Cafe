package com.lowkeycafe.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "food_customizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodCustomization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_item_id", nullable = false)
    private FoodItem foodItem;

    @Column(nullable = false, length = 100)
    private String groupName; // Portion Size, Extra Toppings, Add-ons, Spice Level

    @Builder.Default
    private Boolean isRequired = false;

    @Builder.Default
    private Boolean allowMultiple = false;

    @Builder.Default
    private Integer displayOrder = 1;

    @Builder.Default
    @OneToMany(mappedBy = "customization", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomizationOption> options = new ArrayList<>();
}
