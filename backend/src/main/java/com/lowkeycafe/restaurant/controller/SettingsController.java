package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.entity.Restaurant;
import com.lowkeycafe.restaurant.entity.RestaurantSettings;
import com.lowkeycafe.restaurant.repository.RestaurantRepository;
import com.lowkeycafe.restaurant.repository.RestaurantSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantSettingsRepository settingsRepository;

    @GetMapping
    public ResponseEntity<?> getPublicSettings() {
        Restaurant restaurant = restaurantRepository.findAll().stream().findFirst().orElse(null);
        RestaurantSettings settings = settingsRepository.findFirstByOrderByUpdatedAtDesc().orElse(null);

        Map<String, Object> map = new HashMap<>();
        map.put("name", restaurant != null ? restaurant.getName() : "Lowkey Cafe");
        map.put("tagline", restaurant != null ? restaurant.getTagline() : "Artisan Coffee & Gourmet Bites");
        map.put("address", restaurant != null ? restaurant.getAddress() : "Foodie Lane, Metro City");
        map.put("phone", restaurant != null ? restaurant.getPhone() : "+91 98765 43210");
        map.put("email", restaurant != null ? restaurant.getEmail() : "contact@lowkeycafe.com");
        map.put("logoUrl", restaurant != null ? restaurant.getLogoUrl() : "");
        map.put("wifiName", settings != null ? settings.getWifiName() : "LowkeyCafe_Guest_5G");
        map.put("wifiPassword", settings != null ? settings.getWifiPassword() : "espresso_vibes");
        map.put("taxPercentage", settings != null ? settings.getTaxPercentage() : 5.0);
        map.put("serviceChargePercentage", settings != null ? settings.getServiceChargePercentage() : 5.0);
        map.put("currency", settings != null ? settings.getCurrency() : "INR");
        map.put("currencySymbol", settings != null ? settings.getCurrencySymbol() : "₹");
        map.put("openingTime", settings != null ? settings.getOpeningTime() : "09:00 AM");
        map.put("closingTime", settings != null ? settings.getClosingTime() : "11:00 PM");

        return ResponseEntity.ok(map);
    }
}
