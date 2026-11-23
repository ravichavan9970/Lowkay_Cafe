package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyService {

    private final LoyaltyPointsRepository loyaltyPointsRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final CustomerProfileRepository customerRepository;
    private final RestaurantSettingsRepository settingsRepository;

    public Integer getBalanceByPhone(String phone) {
        return loyaltyPointsRepository.findByCustomerPhone(phone)
                .map(LoyaltyPoints::getPointsBalance)
                .orElse(0);
    }

    @Transactional
    public void awardPoints(Long customerId, Long orderId, BigDecimal amountSpent) {
        CustomerProfile customer = customerRepository.findById(customerId).orElse(null);
        if (customer == null) return;

        RestaurantSettings settings = settingsRepository.findFirstByOrderByUpdatedAtDesc().orElse(null);
        BigDecimal pointsRate = settings != null ? settings.getPointsPerHundred() : new BigDecimal("10.00");

        int pointsToAward = amountSpent.divide(new BigDecimal("100"), 0, RoundingMode.DOWN)
                .multiply(pointsRate).intValue();

        if (pointsToAward <= 0) return;

        LoyaltyPoints lp = loyaltyPointsRepository.findByCustomerId(customerId)
                .orElse(LoyaltyPoints.builder()
                        .customer(customer)
                        .pointsBalance(0)
                        .lifetimePointsEarned(0)
                        .build());

        lp.setPointsBalance(lp.getPointsBalance() + pointsToAward);
        lp.setLifetimePointsEarned(lp.getLifetimePointsEarned() + pointsToAward);
        loyaltyPointsRepository.save(lp);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .customer(customer)
                .orderId(orderId)
                .transactionType("EARNED")
                .points(pointsToAward)
                .description("Earned on Order #" + orderId)
                .createdAt(LocalDateTime.now())
                .build();
        loyaltyTransactionRepository.save(tx);

        log.info("Awarded {} loyalty points to customer {}", pointsToAward, customer.getPhone());
    }

    @Transactional
    public BigDecimal redeemPoints(String phone, int pointsToRedeem) {
        CustomerProfile customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found for phone: " + phone));

        LoyaltyPoints lp = loyaltyPointsRepository.findByCustomerId(customer.getId())
                .orElseThrow(() -> new IllegalArgumentException("No loyalty account found"));

        if (lp.getPointsBalance() < pointsToRedeem) {
            throw new IllegalArgumentException("Insufficient loyalty points balance: " + lp.getPointsBalance());
        }

        RestaurantSettings settings = settingsRepository.findFirstByOrderByUpdatedAtDesc().orElse(null);
        BigDecimal ratio = settings != null ? settings.getPointValueRatio() : BigDecimal.ONE;

        BigDecimal discount = BigDecimal.valueOf(pointsToRedeem).multiply(ratio);

        lp.setPointsBalance(lp.getPointsBalance() - pointsToRedeem);
        loyaltyPointsRepository.save(lp);

        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .customer(customer)
                .transactionType("REDEEMED")
                .points(-pointsToRedeem)
                .description("Redeemed for ₹" + discount + " discount")
                .createdAt(LocalDateTime.now())
                .build();
        loyaltyTransactionRepository.save(tx);

        return discount;
    }
}
