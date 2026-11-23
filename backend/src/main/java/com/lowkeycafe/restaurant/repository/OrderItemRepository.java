package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    List<OrderItem> findByStationIdAndStatus(Long stationId, String status);

    @Query("SELECT oi.foodItem.name, SUM(oi.quantity), SUM(oi.subtotal) " +
           "FROM OrderItem oi GROUP BY oi.foodItem.name ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingItems();
}
