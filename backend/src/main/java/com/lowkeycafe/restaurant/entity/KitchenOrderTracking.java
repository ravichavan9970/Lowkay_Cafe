package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_order_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KitchenOrderTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private KitchenStation station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_cook_id")
    private User assignedCook;

    @Builder.Default
    @Column(nullable = false, length = 30)
    private String status = "NEW_ORDER";

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Builder.Default
    private Boolean delayed = false;

    private String delayReason;
}
