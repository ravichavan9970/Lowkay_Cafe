package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@RequestParam String phone) {
        Integer balance = loyaltyService.getBalanceByPhone(phone);
        return ResponseEntity.ok(Map.of("phone", phone, "balance", balance));
    }

    @PostMapping("/redeem")
    public ResponseEntity<?> redeemPoints(@RequestBody Map<String, Object> request) {
        String phone = (String) request.get("phone");
        Integer points = ((Number) request.get("points")).intValue();
        BigDecimal discount = loyaltyService.redeemPoints(phone, points);
        return ResponseEntity.ok(Map.of("discount", discount, "pointsRedeemed", points));
    }
}
