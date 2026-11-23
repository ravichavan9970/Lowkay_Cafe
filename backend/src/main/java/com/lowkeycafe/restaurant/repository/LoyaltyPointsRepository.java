package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.LoyaltyPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyPointsRepository extends JpaRepository<LoyaltyPoints, Long> {
    Optional<LoyaltyPoints> findByCustomerId(Long customerId);
    Optional<LoyaltyPoints> findByCustomerPhone(String phone);
}
