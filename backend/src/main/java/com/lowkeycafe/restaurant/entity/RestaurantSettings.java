package com.lowkeycafe.restaurant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "restaurant_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Builder.Default
    private String wifiName = "LowkeyCafe_Guest";

    @Builder.Default
    private String wifiPassword = "espresso_vibes";

    @Builder.Default
    private BigDecimal taxPercentage = new BigDecimal("5.00");

    @Builder.Default
    private BigDecimal serviceChargePercentage = new BigDecimal("5.00");

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private String currencySymbol = "₹";

    @Builder.Default
    private String openingTime = "09:00 AM";

    @Builder.Default
    private String closingTime = "11:00 PM";

    @Builder.Default
    private BigDecimal pointsPerHundred = new BigDecimal("10.00");

    @Builder.Default
    private BigDecimal pointValueRatio = new BigDecimal("1.00");

    @Builder.Default
    private Boolean paymentGatewayEnabled = true;

    @Builder.Default
    private Boolean autoAcceptOrders = false;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
