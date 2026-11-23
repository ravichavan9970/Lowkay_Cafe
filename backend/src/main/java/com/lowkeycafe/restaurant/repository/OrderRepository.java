package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Order;
import com.lowkeycafe.restaurant.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByTableTableNumberOrderByCreatedAtDesc(Integer tableNumber);
    List<Order> findByStatusOrderByCreatedAtAsc(OrderStatus status);
    List<Order> findByStatusInOrderByCreatedAtAsc(List<OrderStatus> statuses);

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt <= :endDate ORDER BY o.createdAt DESC")
    List<Order> findOrdersBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = :status")
    Long countByStatus(@Param("status") OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY o.createdAt DESC")
    List<Order> findActiveOrdersForTable(@Param("tableId") Long tableId);
}
