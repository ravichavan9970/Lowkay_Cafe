package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.TableDto;
import com.lowkeycafe.restaurant.dto.WaiterDto;
import com.lowkeycafe.restaurant.entity.OrderStatus;
import com.lowkeycafe.restaurant.service.OrderService;
import com.lowkeycafe.restaurant.service.TableService;
import com.lowkeycafe.restaurant.service.WaiterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/waiter")
@RequiredArgsConstructor
public class WaiterController {

    private final WaiterService waiterService;
    private final OrderService orderService;
    private final TableService tableService;

    // Customer endpoint: Call Waiter
    @PostMapping("/call")
    public ResponseEntity<WaiterDto.WaiterResponse> callWaiter(@RequestBody WaiterDto.CallWaiterRequest request) {
        return ResponseEntity.ok(waiterService.callWaiter(request));
    }

    // Staff endpoint: Get active assistance requests
    @GetMapping("/requests")
    public ResponseEntity<List<WaiterDto.WaiterResponse>> getActiveRequests() {
        return ResponseEntity.ok(waiterService.getActiveRequests());
    }

    @PatchMapping("/requests/{requestId}/accept")
    public ResponseEntity<WaiterDto.WaiterResponse> acceptRequest(
            @PathVariable Long requestId,
            Authentication authentication) {
        String waiterUsername = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(waiterService.acceptRequest(requestId, waiterUsername));
    }

    @PatchMapping("/requests/{requestId}/resolve")
    public ResponseEntity<WaiterDto.WaiterResponse> resolveRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(waiterService.resolveRequest(requestId));
    }

    @PatchMapping("/orders/{orderId}/served")
    public ResponseEntity<?> markOrderServed(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, OrderStatus.SERVED));
    }

    @GetMapping("/floor")
    public ResponseEntity<List<TableDto.TableResponse>> getFloorStatus() {
        return ResponseEntity.ok(tableService.getAllTables());
    }
}
