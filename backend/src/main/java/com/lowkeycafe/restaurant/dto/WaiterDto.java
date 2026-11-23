package com.lowkeycafe.restaurant.dto;

import com.lowkeycafe.restaurant.entity.WaiterRequestStatus;
import com.lowkeycafe.restaurant.entity.WaiterRequestType;
import lombok.*;

import java.time.LocalDateTime;

public class WaiterDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CallWaiterRequest {
        private Integer tableNumber;
        private WaiterRequestType requestType;
        private String additionalNote;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WaiterResponse {
        private Long id;
        private Integer tableNumber;
        private WaiterRequestType requestType;
        private String additionalNote;
        private WaiterRequestStatus status;
        private String assignedWaiterName;
        private LocalDateTime requestedAt;
        private LocalDateTime acceptedAt;
        private LocalDateTime resolvedAt;
    }
}
