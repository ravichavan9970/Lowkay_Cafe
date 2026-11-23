package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.MenuDto;
import com.lowkeycafe.restaurant.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/categories")
    public ResponseEntity<List<MenuDto.CategoryResponse>> getCategories() {
        return ResponseEntity.ok(menuService.getActiveCategories());
    }

    @GetMapping("/items")
    public ResponseEntity<List<MenuDto.FoodItemResponse>> getAllItems() {
        return ResponseEntity.ok(menuService.getAllAvailableFoodItems());
    }

    @GetMapping("/categories/{categoryId}/items")
    public ResponseEntity<List<MenuDto.FoodItemResponse>> getItemsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(menuService.getFoodItemsByCategory(categoryId));
    }

    @GetMapping("/special-offers")
    public ResponseEntity<List<MenuDto.FoodItemResponse>> getSpecialOffers() {
        return ResponseEntity.ok(menuService.getSpecialOffers());
    }

    @GetMapping("/search")
    public ResponseEntity<List<MenuDto.FoodItemResponse>> searchMenu(@RequestParam String q) {
        return ResponseEntity.ok(menuService.searchMenu(q));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<MenuDto.FoodItemResponse> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getFoodItemById(id));
    }
}
