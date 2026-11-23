package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.KitchenOrderTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KitchenOrderTrackingRepository extends JpaRepository<KitchenOrderTracking, Long> {
    List<KitchenOrderTracking> findByStationIdAndStatusNot(Long stationId, String status);
    List<KitchenOrderTracking> findByOrderId(Long orderId);
}
