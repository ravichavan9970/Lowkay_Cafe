package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.FoodCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodCategoryRepository extends JpaRepository<FoodCategory, Long> {
    List<FoodCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
    Optional<FoodCategory> findBySlug(String slug);
}
