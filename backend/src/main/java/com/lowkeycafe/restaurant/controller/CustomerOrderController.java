package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.OrderDto;
import com.lowkeycafe.restaurant.entity.OrderStatus;
import com.lowkeycafe.restaurant.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class CustomerOrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderDto.OrderResponse> createOrder(@RequestBody OrderDto.CreateOrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<OrderDto.OrderResponse> trackOrder(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getOrderByCode(orderCode));
    }

    @GetMapping("/table/{tableNumber}")
    public ResponseEntity<List<OrderDto.OrderResponse>> getOrdersByTable(@PathVariable Integer tableNumber) {
        return ResponseEntity.ok(orderService.getOrdersByTable(tableNumber));
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<OrderDto.OrderResponse> cancelOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED));
    }
}
