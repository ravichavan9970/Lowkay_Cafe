package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.RestaurantSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantSettingsRepository extends JpaRepository<RestaurantSettings, Long> {
    Optional<RestaurantSettings> findFirstByOrderByUpdatedAtDesc();
}
