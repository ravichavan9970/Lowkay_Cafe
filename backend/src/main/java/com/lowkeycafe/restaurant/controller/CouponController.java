package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.entity.Coupon;
import com.lowkeycafe.restaurant.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping("/validate")
    public ResponseEntity<?> validateCoupon(@RequestParam String code) {
        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(code);
        if (couponOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Invalid or expired coupon code"));
        }

        Coupon coupon = couponOpt.get();
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "code", coupon.getCode(),
                "discountPercentage", coupon.getDiscountPercentage(),
                "maxDiscountAmount", coupon.getMaxDiscountAmount() != null ? coupon.getMaxDiscountAmount() : 0,
                "minOrderAmount", coupon.getMinOrderAmount() != null ? coupon.getMinOrderAmount() : 0
        ));
    }
}
