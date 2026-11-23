package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.entity.Notification;
import com.lowkeycafe.restaurant.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public void notifyOrderUpdate(Object orderData, String orderCode) {
        try {
            messagingTemplate.convertAndSend("/topic/orders", orderData);
            if (orderCode != null) {
                messagingTemplate.convertAndSend("/topic/orders/" + orderCode, orderData);
            }
            messagingTemplate.convertAndSend("/topic/kitchen", orderData);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for order: {}", e.getMessage());
        }
    }

    public void notifyWaiterRequest(Object waiterData) {
        try {
            messagingTemplate.convertAndSend("/topic/waiter-requests", waiterData);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for waiter request: {}", e.getMessage());
        }
    }

    public void notifyTableUpdate(Object tableData) {
        try {
            messagingTemplate.convertAndSend("/topic/tables", tableData);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for table: {}", e.getMessage());
        }
    }

    public void notifyAdminStats(Object statsData) {
        try {
            messagingTemplate.convertAndSend("/topic/admin/stats", statsData);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification for admin stats: {}", e.getMessage());
        }
    }

    public void saveAndBroadcastNotification(String recipientRole, String title, String message, String eventType, Long entityId) {
        try {
            Notification notification = Notification.builder()
                    .recipientRole(recipientRole)
                    .title(title)
                    .message(message)
                    .eventType(eventType)
                    .relatedEntityId(entityId)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);

            messagingTemplate.convertAndSend("/topic/notifications/" + recipientRole.toLowerCase(), notification);
        } catch (Exception e) {
            log.error("Error saving notification: {}", e.getMessage());
        }
    }
}
