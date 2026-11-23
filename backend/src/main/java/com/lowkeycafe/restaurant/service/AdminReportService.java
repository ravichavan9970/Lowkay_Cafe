package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.AdminDto;
import com.lowkeycafe.restaurant.entity.BillStatus;
import com.lowkeycafe.restaurant.entity.OrderStatus;
import com.lowkeycafe.restaurant.entity.WaiterRequestStatus;
import com.lowkeycafe.restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminReportService {

    private final RestaurantTableRepository tableRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final BillRepository billRepository;
    private final WaiterRequestRepository waiterRequestRepository;
    private final ReviewService reviewService;

    public AdminDto.DashboardStats getDashboardStats() {
        long totalTables = tableRepository.count();
        long occupiedTables = tableRepository.findByStatus("OCCUPIED").size()
                + tableRepository.findByStatus("ORDER_RECEIVED").size()
                + tableRepository.findByStatus("PREPARING").size()
                + tableRepository.findByStatus("FOOD_READY").size()
                + tableRepository.findByStatus("ASSISTANCE_REQUESTED").size()
                + tableRepository.findByStatus("BILLING_REQUESTED").size();
        long availableTables = totalTables - occupiedTables;

        long pendingKitchen = orderRepository.countByStatus(OrderStatus.NEW_ORDER)
                + orderRepository.countByStatus(OrderStatus.ACCEPTED)
                + orderRepository.countByStatus(OrderStatus.PREPARING);

        long readyOrders = orderRepository.countByStatus(OrderStatus.READY);
        long activeOrders = pendingKitchen + readyOrders + orderRepository.countByStatus(OrderStatus.SERVED);
        long pendingRequests = waiterRequestRepository.countByStatus(WaiterRequestStatus.PENDING);

        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        BigDecimal todaySales = billRepository.sumPaidAmountBetween(startOfToday, endOfToday);
        if (todaySales == null) todaySales = BigDecimal.ZERO;

        Long todayCompleted = billRepository.countPaidBillsBetween(startOfToday, endOfToday);
        if (todayCompleted == null) todayCompleted = 0L;

        Double avgRating = reviewService.getAverageOverallRating();

        return AdminDto.DashboardStats.builder()
                .totalTables(totalTables)
                .availableTables(Math.max(0, availableTables))
                .occupiedTables(occupiedTables)
                .activeOrders(activeOrders)
                .pendingKitchenOrders(pendingKitchen)
                .readyOrders(readyOrders)
                .pendingWaiterRequests(pendingRequests)
                .todaySales(todaySales)
                .todayCompletedOrders(todayCompleted)
                .avgCustomerRating(avgRating)
                .build();
    }

    public AdminDto.SalesAnalytics getSalesAnalytics() {
        LocalDateTime startOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfToday = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        LocalDateTime startOfWeek = LocalDateTime.of(LocalDate.now().minusDays(7), LocalTime.MIN);
        LocalDateTime startOfMonth = LocalDateTime.of(LocalDate.now().minusDays(30), LocalTime.MIN);

        BigDecimal daily = billRepository.sumPaidAmountBetween(startOfToday, endOfToday);
        BigDecimal weekly = billRepository.sumPaidAmountBetween(startOfWeek, endOfToday);
        BigDecimal monthly = billRepository.sumPaidAmountBetween(startOfMonth, endOfToday);

        List<Object[]> rawTopItems = orderItemRepository.findTopSellingItems();
        List<AdminDto.TopItemDto> topItems = new ArrayList<>();

        int count = 0;
        for (Object[] row : rawTopItems) {
            if (count++ >= 5) break;
            topItems.add(AdminDto.TopItemDto.builder()
                    .itemName((String) row[0])
                    .quantitySold(((Number) row[1]).longValue())
                    .revenue((BigDecimal) row[2])
                    .build());
        }

        return AdminDto.SalesAnalytics.builder()
                .dailyRevenue(daily != null ? daily : BigDecimal.ZERO)
                .weeklyRevenue(weekly != null ? weekly : BigDecimal.ZERO)
                .monthlyRevenue(monthly != null ? monthly : BigDecimal.ZERO)
                .topSellingItems(topItems)
                .build();
    }
}
