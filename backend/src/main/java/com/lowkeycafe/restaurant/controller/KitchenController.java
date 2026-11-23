package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.OrderDto;
import com.lowkeycafe.restaurant.entity.KitchenStation;
import com.lowkeycafe.restaurant.entity.OrderStatus;
import com.lowkeycafe.restaurant.service.KitchenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
public class KitchenController {

    private final KitchenService kitchenService;

    @GetMapping("/stations")
    public ResponseEntity<List<KitchenStation>> getStations() {
        return ResponseEntity.ok(kitchenService.getAllStations());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto.OrderResponse>> getAllActiveOrders() {
        return ResponseEntity.ok(kitchenService.getOrdersForStation(null));
    }

    @GetMapping("/orders/station/{stationId}")
    public ResponseEntity<List<OrderDto.OrderResponse>> getOrdersByStation(@PathVariable Long stationId) {
        return ResponseEntity.ok(kitchenService.getOrdersForStation(stationId));
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderDto.OrderResponse> updateStatus(
            @PathVariable Long orderId,
            @RequestBody OrderDto.StatusUpdateRequest request) {
        return ResponseEntity.ok(kitchenService.advanceOrderStatus(orderId, request.getStatus()));
    }
}
