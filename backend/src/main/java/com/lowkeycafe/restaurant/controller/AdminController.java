package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.AdminDto;
import com.lowkeycafe.restaurant.dto.MenuDto;
import com.lowkeycafe.restaurant.dto.OrderDto;
import com.lowkeycafe.restaurant.dto.TableDto;
import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.*;
import com.lowkeycafe.restaurant.service.AdminReportService;
import com.lowkeycafe.restaurant.service.MenuService;
import com.lowkeycafe.restaurant.service.OrderService;
import com.lowkeycafe.restaurant.service.TableService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminReportService adminReportService;
    private final TableService tableService;
    private final MenuService menuService;
    private final OrderService orderService;
    private final OrderRepository orderRepository;
    private final FoodItemRepository foodItemRepository;
    private final FoodCategoryRepository categoryRepository;
    private final KitchenStationRepository stationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDto.DashboardStats> getDashboardStats() {
        return ResponseEntity.ok(adminReportService.getDashboardStats());
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminDto.SalesAnalytics> getAnalytics() {
        return ResponseEntity.ok(adminReportService.getSalesAnalytics());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto.OrderResponse>> getOrdersHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDateTime start = startDate != null ? LocalDateTime.of(startDate, LocalTime.MIN) : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? LocalDateTime.of(endDate, LocalTime.MAX) : LocalDateTime.now();

        List<Order> orders = orderRepository.findOrdersBetween(start, end);
        return ResponseEntity.ok(orders.stream().map(orderService::mapOrderToDto).collect(Collectors.toList()));
    }

    @PostMapping("/tables")
    public ResponseEntity<TableDto.TableResponse> createTable(@RequestBody TableDto.CreateTableRequest request) {
        return ResponseEntity.ok(tableService.createTable(request));
    }

    @PostMapping("/tables/{tableNumber}/regenerate-qr")
    public ResponseEntity<TableDto.TableResponse> regenerateQr(
            @PathVariable Integer tableNumber,
            @RequestParam(required = false) String baseUrl) {
        return ResponseEntity.ok(tableService.regenerateQr(tableNumber, baseUrl));
    }

    @PostMapping("/tables/regenerate-all-qr")
    public ResponseEntity<List<TableDto.TableResponse>> regenerateAllQrCodes(
            @RequestParam(required = false) String baseUrl) {
        return ResponseEntity.ok(tableService.regenerateAllQrCodes(baseUrl));
    }

    @GetMapping("/network-info")
    public ResponseEntity<Map<String, String>> getNetworkInfo() {
        String lanIp = tableService.getLocalLanIp();
        String effectiveUrl = tableService.resolveEffectiveBaseUrl(null);
        return ResponseEntity.ok(Map.of(
                "lanIp", lanIp,
                "recommendedBaseUrl", effectiveUrl,
                "hint", "Use this URL on table QR codes so mobile phones connected to Wi-Fi can open the menu."
        ));
    }

    @PostMapping("/menu/items")
    public ResponseEntity<MenuDto.FoodItemResponse> createFoodItem(@RequestBody MenuDto.CreateFoodItemRequest req) {
        FoodCategory category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + req.getCategoryId()));

        KitchenStation station = null;
        if (req.getStationId() != null) {
            station = stationRepository.findById(req.getStationId()).orElse(null);
        }

        FoodItem item = FoodItem.builder()
                .category(category)
                .station(station)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .imageUrl(req.getImageUrl())
                .isVeg(req.getIsVeg() != null ? req.getIsVeg() : true)
                .isVegan(req.getIsVegan() != null ? req.getIsVegan() : false)
                .isGlutenFree(req.getIsGlutenFree() != null ? req.getIsGlutenFree() : false)
                .spiceLevel(req.getSpiceLevel() != null ? req.getSpiceLevel() : SpiceLevel.MEDIUM)
                .prepTimeMinutes(req.getPrepTimeMinutes() != null ? req.getPrepTimeMinutes() : 15)
                .allergyInfo(req.getAllergyInfo())
                .ingredients(req.getIngredients())
                .isAvailable(req.getIsAvailable() != null ? req.getIsAvailable() : true)
                .isPopular(req.getIsPopular() != null ? req.getIsPopular() : false)
                .isSpecialOffer(req.getIsSpecialOffer() != null ? req.getIsSpecialOffer() : false)
                .originalPrice(req.getOriginalPrice())
                .build();

        item = foodItemRepository.save(item);
        return ResponseEntity.ok(menuService.mapFoodItemToDto(item));
    }

    @PatchMapping("/menu/items/{id}/availability")
    public ResponseEntity<?> toggleItemAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.toggleAvailability(id));
    }

    @GetMapping("/staff")
    public ResponseEntity<?> getAllStaff() {
        return ResponseEntity.ok(userRepository.findAll().stream().map(u -> Map.of(
                "id", u.getId(),
                "username", u.getUsername(),
                "fullName", u.getFullName(),
                "email", u.getEmail(),
                "phone", u.getPhone() != null ? u.getPhone() : "",
                "isActive", u.getIsActive(),
                "roles", u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList())
        )).collect(Collectors.toList()));
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaffUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String email = body.get("email");
        String fullName = body.get("fullName");
        String phone = body.get("phone");
        String roleStr = body.get("role");

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body("Username already taken");
        }

        RoleType rt = RoleType.ROLE_WAITER;
        if ("KITCHEN".equalsIgnoreCase(roleStr) || "KITCHEN_STAFF".equalsIgnoreCase(roleStr)) {
            rt = RoleType.ROLE_KITCHEN_STAFF;
        } else if ("ADMIN".equalsIgnoreCase(roleStr)) {
            rt = RoleType.ROLE_ADMIN;
        }

        Role role = roleRepository.findByName(rt).orElseThrow();

        User user = User.builder()
                .username(username)
                .email(email)
                .fullName(fullName)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .roles(Set.of(role))
                .isActive(true)
                .build();
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Staff user created successfully", "username", username));
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@RequestBody AdminDto.SettingsDto dto) {
        Restaurant restaurant = restaurantRepository.findAll().stream().findFirst().orElseThrow();
        if (dto.getRestaurantName() != null) restaurant.setName(dto.getRestaurantName());
        if (dto.getTagline() != null) restaurant.setTagline(dto.getTagline());
        if (dto.getAddress() != null) restaurant.setAddress(dto.getAddress());
        if (dto.getPhone() != null) restaurant.setPhone(dto.getPhone());
        if (dto.getEmail() != null) restaurant.setEmail(dto.getEmail());
        restaurantRepository.save(restaurant);

        RestaurantSettings settings = settingsRepository.findFirstByOrderByUpdatedAtDesc().orElseThrow();
        if (dto.getWifiName() != null) settings.setWifiName(dto.getWifiName());
        if (dto.getWifiPassword() != null) settings.setWifiPassword(dto.getWifiPassword());
        if (dto.getTaxPercentage() != null) settings.setTaxPercentage(dto.getTaxPercentage());
        if (dto.getServiceChargePercentage() != null) settings.setServiceChargePercentage(dto.getServiceChargePercentage());
        if (dto.getCurrency() != null) settings.setCurrency(dto.getCurrency());
        if (dto.getCurrencySymbol() != null) settings.setCurrencySymbol(dto.getCurrencySymbol());
        if (dto.getOpeningTime() != null) settings.setOpeningTime(dto.getOpeningTime());
        if (dto.getClosingTime() != null) settings.setClosingTime(dto.getClosingTime());
        settingsRepository.save(settings);

        return ResponseEntity.ok(Map.of("message", "Settings updated successfully"));
    }
}
