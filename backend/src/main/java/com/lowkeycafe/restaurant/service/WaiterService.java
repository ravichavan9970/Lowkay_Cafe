package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.WaiterDto;
import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.RestaurantTableRepository;
import com.lowkeycafe.restaurant.repository.UserRepository;
import com.lowkeycafe.restaurant.repository.WaiterRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WaiterService {

    private final WaiterRequestRepository waiterRequestRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public WaiterDto.WaiterResponse callWaiter(WaiterDto.CallWaiterRequest request) {
        RestaurantTable table = tableRepository.findByTableNumber(request.getTableNumber())
                .orElseThrow(() -> new IllegalArgumentException("Table #" + request.getTableNumber() + " not found"));

        // Anti-spam check: prevent spamming duplicate pending requests within 60 seconds
        List<WaiterRequest> existingPending = waiterRequestRepository
                .findByTableTableNumberOrderByRequestedAtDesc(request.getTableNumber());

        for (WaiterRequest r : existingPending) {
            if (r.getStatus() == WaiterRequestStatus.PENDING && r.getRequestType() == request.getRequestType()) {
                log.info("Duplicate request prevented for table #{}", request.getTableNumber());
                return mapToDto(r);
            }
        }

        WaiterRequest waiterRequest = WaiterRequest.builder()
                .table(table)
                .requestType(request.getRequestType())
                .additionalNote(request.getAdditionalNote())
                .status(WaiterRequestStatus.PENDING)
                .requestedAt(LocalDateTime.now())
                .build();

        waiterRequest = waiterRequestRepository.save(waiterRequest);

        // Update table status
        table.setStatus("ASSISTANCE_REQUESTED");
        tableRepository.save(table);

        WaiterDto.WaiterResponse responseDto = mapToDto(waiterRequest);

        // Broadcast to waiters and update floor map
        notificationService.notifyWaiterRequest(responseDto);
        notificationService.notifyTableUpdate(table);
        notificationService.saveAndBroadcastNotification(
                "WAITER",
                "Table #" + table.getTableNumber() + " Needs " + request.getRequestType(),
                "Customer requested: " + (request.getAdditionalNote() != null ? request.getAdditionalNote() : request.getRequestType().name()),
                "CALL_WAITER",
                waiterRequest.getId()
        );

        return responseDto;
    }

    @Transactional(readOnly = true)
    public List<WaiterDto.WaiterResponse> getActiveRequests() {
        return waiterRequestRepository.findByStatusInOrderByRequestedAtAsc(
                List.of(WaiterRequestStatus.PENDING, WaiterRequestStatus.IN_PROGRESS)
        ).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public WaiterDto.WaiterResponse acceptRequest(Long requestId, String waiterUsername) {
        WaiterRequest request = waiterRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (waiterUsername != null) {
            userRepository.findByUsername(waiterUsername).ifPresent(request::setAssignedWaiter);
        }
        request.setStatus(WaiterRequestStatus.IN_PROGRESS);
        request.setAcceptedAt(LocalDateTime.now());
        request = waiterRequestRepository.save(request);

        WaiterDto.WaiterResponse dto = mapToDto(request);
        notificationService.notifyWaiterRequest(dto);
        return dto;
    }

    @Transactional
    public WaiterDto.WaiterResponse resolveRequest(Long requestId) {
        WaiterRequest request = waiterRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        request.setStatus(WaiterRequestStatus.RESOLVED);
        request.setResolvedAt(LocalDateTime.now());
        request = waiterRequestRepository.save(request);

        // Reset table status if no other pending requests
        RestaurantTable table = request.getTable();
        if (table != null) {
            long remaining = waiterRequestRepository.findByTableTableNumberOrderByRequestedAtDesc(table.getTableNumber())
                    .stream().filter(r -> r.getStatus() != WaiterRequestStatus.RESOLVED).count();
            if (remaining == 0 && "ASSISTANCE_REQUESTED".equals(table.getStatus())) {
                table.setStatus("OCCUPIED");
                tableRepository.save(table);
                notificationService.notifyTableUpdate(table);
            }
        }

        WaiterDto.WaiterResponse dto = mapToDto(request);
        notificationService.notifyWaiterRequest(dto);
        return dto;
    }

    private WaiterDto.WaiterResponse mapToDto(WaiterRequest req) {
        return WaiterDto.WaiterResponse.builder()
                .id(req.getId())
                .tableNumber(req.getTable() != null ? req.getTable().getTableNumber() : null)
                .requestType(req.getRequestType())
                .additionalNote(req.getAdditionalNote())
                .status(req.getStatus())
                .assignedWaiterName(req.getAssignedWaiter() != null ? req.getAssignedWaiter().getFullName() : null)
                .requestedAt(req.getRequestedAt())
                .acceptedAt(req.getAcceptedAt())
                .resolvedAt(req.getResolvedAt())
                .build();
    }
}
