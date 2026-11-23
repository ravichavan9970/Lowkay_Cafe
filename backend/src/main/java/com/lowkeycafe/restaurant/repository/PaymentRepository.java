package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByPaymentReference(String paymentReference);
    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);
    List<Payment> findByBillId(Long billId);
}
