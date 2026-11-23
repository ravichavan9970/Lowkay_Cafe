package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    Optional<RestaurantTable> findByTableNumber(Integer tableNumber);
    List<RestaurantTable> findByIsActiveTrueOrderByTableNumberAsc();
    List<RestaurantTable> findByStatus(String status);
}
