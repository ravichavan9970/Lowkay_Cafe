package com.lowkeycafe.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "food_item_id", nullable = false)
    private FoodItem foodItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private KitchenStation station;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Builder.Default
    @Column(length = 50)
    private String selectedPortion = "Regular";

    @Builder.Default
    @Column(length = 20)
    private String selectedSpiceLevel = "MEDIUM";

    @Column(columnDefinition = "TEXT")
    private String removedIngredients;

    @Column(columnDefinition = "TEXT")
    private String itemNotes;

    @Builder.Default
    @Column(length = 30)
    private String status = "NEW_ORDER";

    @Builder.Default
    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemCustomization> selectedCustomizations = new ArrayList<>();
}
