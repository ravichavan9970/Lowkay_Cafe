package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.OrderDto;
import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderItemCustomizationRepository orderItemCustomizationRepository;
    private final RestaurantTableRepository tableRepository;
    private final FoodItemRepository foodItemRepository;
    private final CouponRepository couponRepository;
    private final RestaurantSettingsRepository settingsRepository;
    private final CustomerProfileRepository customerRepository;
    private final NotificationService notificationService;
    private final KitchenOrderTrackingRepository kitchenTrackingRepository;

    @Transactional
    public OrderDto.OrderResponse createOrder(OrderDto.CreateOrderRequest request) {
        RestaurantTable table = tableRepository.findByTableNumber(request.getTableNumber())
                .orElseThrow(() -> new IllegalArgumentException("Table #" + request.getTableNumber() + " not found"));

        RestaurantSettings settings = settingsRepository.findFirstByOrderByUpdatedAtDesc().orElse(null);
        BigDecimal taxPercent = settings != null ? settings.getTaxPercentage() : new BigDecimal("5.00");
        BigDecimal serviceChargePercent = settings != null ? settings.getServiceChargePercentage() : new BigDecimal("5.00");

        // Customer Profile
        CustomerProfile customer = null;
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            customer = customerRepository.findByPhone(request.getCustomerPhone())
                    .orElseGet(() -> customerRepository.save(CustomerProfile.builder()
                            .name(request.getCustomerName() != null ? request.getCustomerName() : "Guest Diner")
                            .phone(request.getCustomerPhone())
                            .build()));
        }

        String orderCode = "ORD-" + System.currentTimeMillis() % 1000000;

        Order order = Order.builder()
                .orderCode(orderCode)
                .table(table)
                .customer(customer)
                .customerName(request.getCustomerName() != null && !request.getCustomerName().isBlank() ? request.getCustomerName() : "Guest Diner")
                .customerPhone(request.getCustomerPhone())
                .specialInstructions(request.getSpecialInstructions())
                .status(OrderStatus.NEW_ORDER)
                .subtotal(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .serviceCharge(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .grandTotal(BigDecimal.ZERO)
                .estimatedPrepMinutes(20)
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        order = orderRepository.save(order);

        BigDecimal subtotal = BigDecimal.ZERO;
        int maxPrepTime = 15;

        for (OrderDto.CreateOrderItemRequest itemReq : request.getItems()) {
            FoodItem foodItem = foodItemRepository.findById(itemReq.getFoodItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Food item not found: " + itemReq.getFoodItemId()));

            if (foodItem.getPrepTimeMinutes() != null && foodItem.getPrepTimeMinutes() > maxPrepTime) {
                maxPrepTime = foodItem.getPrepTimeMinutes();
            }

            BigDecimal itemPrice = foodItem.getPrice();
            BigDecimal customizationExtra = BigDecimal.ZERO;

            List<OrderItemCustomization> itemCusts = new ArrayList<>();

            if (itemReq.getCustomizations() != null) {
                for (OrderDto.SelectedCustomizationRequest custReq : itemReq.getCustomizations()) {
                    BigDecimal extra = custReq.getAdditionalPrice() != null ? custReq.getAdditionalPrice() : BigDecimal.ZERO;
                    customizationExtra = customizationExtra.add(extra);

                    OrderItemCustomization oic = OrderItemCustomization.builder()
                            .optionId(custReq.getOptionId())
                            .groupName(custReq.getGroupName())
                            .optionName(custReq.getOptionName())
                            .additionalPrice(extra)
                            .build();
                    itemCusts.add(oic);
                }
            }

            BigDecimal effectiveUnitPrice = itemPrice.add(customizationExtra);
            BigDecimal itemSubtotal = effectiveUnitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .foodItem(foodItem)
                    .station(foodItem.getStation())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(effectiveUnitPrice)
                    .subtotal(itemSubtotal)
                    .selectedPortion(itemReq.getSelectedPortion() != null ? itemReq.getSelectedPortion() : "Regular")
                    .selectedSpiceLevel(itemReq.getSelectedSpiceLevel() != null ? itemReq.getSelectedSpiceLevel() : "MEDIUM")
                    .removedIngredients(itemReq.getRemovedIngredients())
                    .itemNotes(itemReq.getItemNotes())
                    .status("NEW_ORDER")
                    .build();

            orderItem = orderItemRepository.save(orderItem);

            for (OrderItemCustomization oic : itemCusts) {
                oic.setOrderItem(orderItem);
                orderItemCustomizationRepository.save(oic);
            }
            orderItem.setSelectedCustomizations(itemCusts);
            order.getItems().add(orderItem);

            // Record Kitchen Station routing
            if (foodItem.getStation() != null) {
                KitchenOrderTracking kot = KitchenOrderTracking.builder()
                        .order(order)
                        .station(foodItem.getStation())
                        .status("NEW_ORDER")
                        .build();
                kitchenTrackingRepository.save(kot);
            }
        }

        // Apply coupon if given
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(request.getCouponCode()).orElse(null);
            if (coupon != null && subtotal.compareTo(coupon.getMinOrderAmount()) >= 0) {
                discountAmount = subtotal.multiply(coupon.getDiscountPercentage())
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                    discountAmount = coupon.getMaxDiscountAmount();
                }
                coupon.setTimesUsed(coupon.getTimesUsed() + 1);
                couponRepository.save(coupon);
                order.setAppliedCouponCode(coupon.getCode());
            }
        }

        BigDecimal taxableAmount = subtotal.subtract(discountAmount);
        if (taxableAmount.compareTo(BigDecimal.ZERO) < 0) taxableAmount = BigDecimal.ZERO;

        BigDecimal taxAmount = taxableAmount.multiply(taxPercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal serviceCharge = taxableAmount.multiply(serviceChargePercent).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = taxableAmount.add(taxAmount).add(serviceCharge);

        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setTaxAmount(taxAmount);
        order.setServiceCharge(serviceCharge);
        order.setGrandTotal(grandTotal);
        order.setEstimatedPrepMinutes(maxPrepTime);

        // Update table status
        table.setStatus("ORDER_RECEIVED");
        tableRepository.save(table);

        order = orderRepository.save(order);

        OrderDto.OrderResponse responseDto = mapOrderToDto(order);

        // Notify Kitchen, Waiters, and Admin
        notificationService.notifyOrderUpdate(responseDto, order.getOrderCode());
        notificationService.notifyTableUpdate(table);
        notificationService.saveAndBroadcastNotification(
                "KITCHEN_STAFF",
                "New Order " + order.getOrderCode(),
                "Table #" + table.getTableNumber() + " placed an order for ₹" + grandTotal,
                "NEW_ORDER",
                order.getId()
        );

        return responseDto;
    }

    @Transactional
    public OrderDto.OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        order.setStatus(newStatus);
        LocalDateTime now = LocalDateTime.now();

        switch (newStatus) {
            case ACCEPTED -> order.setAcceptedAt(now);
            case PREPARING -> order.setPreparingAt(now);
            case READY -> order.setReadyAt(now);
            case SERVED -> order.setServedAt(now);
            case COMPLETED -> order.setCompletedAt(now);
            case CANCELLED -> order.setCancelledAt(now);
        }

        // Synchronize table status
        RestaurantTable table = order.getTable();
        if (table != null) {
            if (newStatus == OrderStatus.PREPARING) {
                table.setStatus("PREPARING");
            } else if (newStatus == OrderStatus.READY) {
                table.setStatus("FOOD_READY");
                notificationService.saveAndBroadcastNotification(
                        "WAITER",
                        "Food Ready for Table #" + table.getTableNumber(),
                        "Order " + order.getOrderCode() + " is ready to be served!",
                        "FOOD_READY",
                        order.getId()
                );
            } else if (newStatus == OrderStatus.SERVED) {
                table.setStatus("OCCUPIED");
            } else if (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.CANCELLED) {
                table.setStatus("AVAILABLE");
            }
            tableRepository.save(table);
        }

        order = orderRepository.save(order);
        OrderDto.OrderResponse response = mapOrderToDto(order);

        notificationService.notifyOrderUpdate(response, order.getOrderCode());
        if (table != null) {
            notificationService.notifyTableUpdate(table);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public OrderDto.OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with code: " + orderCode));
        return mapOrderToDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto.OrderResponse> getOrdersByTable(Integer tableNumber) {
        return orderRepository.findByTableTableNumberOrderByCreatedAtDesc(tableNumber).stream()
                .map(this::mapOrderToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDto.OrderResponse> getActiveKitchenOrders() {
        return orderRepository.findByStatusInOrderByCreatedAtAsc(
                List.of(OrderStatus.NEW_ORDER, OrderStatus.ACCEPTED, OrderStatus.PREPARING)
        ).stream().map(this::mapOrderToDto).collect(Collectors.toList());
    }

    public OrderDto.OrderResponse mapOrderToDto(Order order) {
        List<OrderDto.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderDto.OrderItemResponse.builder()
                        .id(item.getId())
                        .foodItemId(item.getFoodItem().getId())
                        .foodItemName(item.getFoodItem().getName())
                        .foodItemImage(item.getFoodItem().getImageUrl())
                        .categoryName(item.getFoodItem().getCategory() != null ? item.getFoodItem().getCategory().getName() : "")
                        .stationId(item.getStation() != null ? item.getStation().getId() : null)
                        .stationName(item.getStation() != null ? item.getStation().getName() : "Main Kitchen")
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .selectedPortion(item.getSelectedPortion())
                        .selectedSpiceLevel(item.getSelectedSpiceLevel())
                        .removedIngredients(item.getRemovedIngredients())
                        .itemNotes(item.getItemNotes())
                        .allergyInfo(item.getFoodItem().getAllergyInfo())
                        .status(item.getStatus())
                        .customizations(item.getSelectedCustomizations().stream()
                                .map(c -> OrderDto.SelectedCustomizationRequest.builder()
                                        .optionId(c.getOptionId())
                                        .groupName(c.getGroupName())
                                        .optionName(c.getOptionName())
                                        .additionalPrice(c.getAdditionalPrice())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        return OrderDto.OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .tableNumber(order.getTable() != null ? order.getTable().getTableNumber() : null)
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .serviceCharge(order.getServiceCharge())
                .discountAmount(order.getDiscountAmount())
                .appliedCouponCode(order.getAppliedCouponCode())
                .grandTotal(order.getGrandTotal())
                .specialInstructions(order.getSpecialInstructions())
                .estimatedPrepMinutes(order.getEstimatedPrepMinutes())
                .createdAt(order.getCreatedAt())
                .acceptedAt(order.getAcceptedAt())
                .preparingAt(order.getPreparingAt())
                .readyAt(order.getReadyAt())
                .servedAt(order.getServedAt())
                .items(itemResponses)
                .build();
    }
}
