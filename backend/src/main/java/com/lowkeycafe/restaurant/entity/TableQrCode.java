package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "table_qr_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TableQrCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false, unique = true)
    private RestaurantTable table;

    @Column(nullable = false, unique = true)
    private String accessToken;

    @Column(nullable = false, length = 500)
    private String targetUrl;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String qrImageData; // Base64 Data URI

    @CreationTimestamp
    private LocalDateTime generatedAt;

    @Builder.Default
    private Boolean isValid = true;
}
