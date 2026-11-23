package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.OrderDto;
import com.lowkeycafe.restaurant.entity.KitchenStation;
import com.lowkeycafe.restaurant.entity.OrderStatus;
import com.lowkeycafe.restaurant.repository.KitchenStationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenService {

    private final OrderService orderService;
    private final KitchenStationRepository stationRepository;

    public List<KitchenStation> getAllStations() {
        return stationRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public List<OrderDto.OrderResponse> getOrdersForStation(Long stationId) {
        List<OrderDto.OrderResponse> allKitchenOrders = orderService.getActiveKitchenOrders();

        if (stationId == null || stationId <= 0) {
            return allKitchenOrders;
        }

        // Filter orders that have at least one item assigned to this station
        return allKitchenOrders.stream()
                .filter(order -> order.getItems().stream()
                        .anyMatch(item -> item.getStationId() != null && item.getStationId().equals(stationId)))
                .collect(Collectors.toList());
    }

    public OrderDto.OrderResponse advanceOrderStatus(Long orderId, OrderStatus nextStatus) {
        return orderService.updateOrderStatus(orderId, nextStatus);
    }
}
