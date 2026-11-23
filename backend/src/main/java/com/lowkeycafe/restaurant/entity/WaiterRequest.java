package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "waiter_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaiterRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private RestaurantTable table;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private WaiterRequestType requestType; // ASSISTANCE, WATER, EXTRA_PLATES, MENU_HELP, BILL_REQUEST, OTHER

    @Column(columnDefinition = "TEXT")
    private String additionalNote;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 30)
    private WaiterRequestStatus status = WaiterRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_waiter_id")
    private User assignedWaiter;

    @CreationTimestamp
    private LocalDateTime requestedAt;

    private LocalDateTime acceptedAt;
    private LocalDateTime resolvedAt;
}
