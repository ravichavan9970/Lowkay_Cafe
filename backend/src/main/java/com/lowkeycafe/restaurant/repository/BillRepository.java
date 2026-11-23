package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Bill;
import com.lowkeycafe.restaurant.entity.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    Optional<Bill> findByBillNumber(String billNumber);
    Optional<Bill> findByOrderId(Long orderId);
    List<Bill> findByTableTableNumberAndStatusNot(Integer tableNumber, BillStatus status);

    @Query("SELECT SUM(b.finalPayableAmount) FROM Bill b WHERE b.status = 'PAID' AND b.paidAt >= :start AND b.paidAt <= :end")
    BigDecimal sumPaidAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.status = 'PAID' AND b.paidAt >= :start AND b.paidAt <= :end")
    Long countPaidBillsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
