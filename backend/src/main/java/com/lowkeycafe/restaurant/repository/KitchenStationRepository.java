package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.KitchenStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenStationRepository extends JpaRepository<KitchenStation, Long> {
    List<KitchenStation> findByIsActiveTrueOrderByDisplayOrderAsc();
}
