package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private CustomerProfile customer;

    @Column(nullable = false)
    private Integer foodRating; // 1 to 5

    @Column(nullable = false)
    private Integer serviceRating; // 1 to 5

    @Column(nullable = false)
    private Integer cleanlinessRating; // 1 to 5

    @Column(nullable = false)
    private Integer overallRating; // 1 to 5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Builder.Default
    private Boolean isPublic = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
