package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.FoodCustomization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodCustomizationRepository extends JpaRepository<FoodCustomization, Long> {
    List<FoodCustomization> findByFoodItemIdOrderByDisplayOrderAsc(Long foodItemId);
}
