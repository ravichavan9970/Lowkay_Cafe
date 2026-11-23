package com.lowkeycafe.restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bill_splits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @Column(nullable = false)
    private Integer splitNumber;

    @Column(nullable = false, length = 30)
    private String splitType; // EQUAL, BY_ITEM, CUSTOM_AMOUNT

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal allocatedAmount;

    @Builder.Default
    private Boolean isPaid = false;

    private String payerName;

    private String paymentMethod;

    private LocalDateTime paidAt;
}
