package com.lowkeycafe.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tips")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @Column(nullable = false, length = 20)
    private String tipType; // PERCENTAGE, CUSTOM, NONE

    @Column(precision = 5, scale = 2)
    private BigDecimal percentageValue;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tipAmount = BigDecimal.ZERO;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
