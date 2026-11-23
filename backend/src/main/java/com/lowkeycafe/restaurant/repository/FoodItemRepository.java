package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByIsAvailableTrue();
    List<FoodItem> findByCategoryIdAndIsAvailableTrue(Long categoryId);
    List<FoodItem> findByIsSpecialOfferTrueAndIsAvailableTrue();
    List<FoodItem> findByIsPopularTrueAndIsAvailableTrue();
    List<FoodItem> findByStationIdAndIsAvailableTrue(Long stationId);
    Optional<FoodItem> findByName(String name);
    boolean existsByName(String name);

    @Query("SELECT f FROM FoodItem f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(f.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<FoodItem> searchFoodItems(@Param("query") String query);
}
