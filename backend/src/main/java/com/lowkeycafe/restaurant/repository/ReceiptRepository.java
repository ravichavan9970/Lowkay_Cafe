package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    Optional<Receipt> findByReceiptNumber(String receiptNumber);
    Optional<Receipt> findByBillId(Long billId);
}
