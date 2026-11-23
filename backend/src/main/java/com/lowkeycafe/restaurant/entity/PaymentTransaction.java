package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(nullable = false, unique = true, length = 100)
    private String transactionCode;

    @Builder.Default
    @Column(length = 50)
    private String gatewayName = "RAZORPAY";

    @Column(columnDefinition = "TEXT")
    private String payloadRequest;

    @Column(columnDefinition = "TEXT")
    private String payloadResponse;

    @Column(nullable = false, length = 30)
    private String status;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
