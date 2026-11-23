package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "receipts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String receiptNumber;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false, unique = true)
    private Bill bill;

    @Column(length = 500)
    private String pdfPath;

    @Column(length = 150)
    private String emailedTo;

    private LocalDateTime emailSentAt;

    @CreationTimestamp
    private LocalDateTime generatedAt;
}
