package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
    List<Notification> findTop20ByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
}
