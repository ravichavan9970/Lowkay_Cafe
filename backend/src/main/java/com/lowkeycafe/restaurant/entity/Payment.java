package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String paymentReference; // PAY-2026-XXXX

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMethod paymentMethod; // UPI, CARD, CASH, RAZORPAY

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 30)
    private PaymentStatus status = PaymentStatus.PENDING; // PENDING, COMPLETED, FAILED, REFUNDED

    private String gatewayOrderId;
    private String gatewayPaymentId;
    private String gatewaySignature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by_staff_id")
    private User collectedByStaff;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime verifiedAt;
}
