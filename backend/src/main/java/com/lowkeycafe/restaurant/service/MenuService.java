package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.MenuDto;
import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final FoodCategoryRepository categoryRepository;
    private final FoodItemRepository foodItemRepository;
    private final FoodCustomizationRepository customizationRepository;
    private final CustomizationOptionRepository optionRepository;
    private final KitchenStationRepository stationRepository;

    @Transactional(readOnly = true)
    public List<MenuDto.CategoryResponse> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::mapCategoryToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuDto.FoodItemResponse> getAllAvailableFoodItems() {
        return foodItemRepository.findByIsAvailableTrue().stream()
                .map(this::mapFoodItemToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuDto.FoodItemResponse> getFoodItemsByCategory(Long categoryId) {
        return foodItemRepository.findByCategoryIdAndIsAvailableTrue(categoryId).stream()
                .map(this::mapFoodItemToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuDto.FoodItemResponse> getSpecialOffers() {
        return foodItemRepository.findByIsSpecialOfferTrueAndIsAvailableTrue().stream()
                .map(this::mapFoodItemToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MenuDto.FoodItemResponse> searchMenu(String query) {
        return foodItemRepository.searchFoodItems(query).stream()
                .map(this::mapFoodItemToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MenuDto.FoodItemResponse getFoodItemById(Long id) {
        FoodItem item = foodItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food item not found with id: " + id));
        return mapFoodItemToDto(item);
    }

    @Transactional
    public FoodItem toggleAvailability(Long id) {
        FoodItem item = foodItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Food item not found with id: " + id));
        item.setIsAvailable(!item.getIsAvailable());
        return foodItemRepository.save(item);
    }

    private MenuDto.CategoryResponse mapCategoryToDto(FoodCategory category) {
        return MenuDto.CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .iconName(category.getIconName())
                .imageUrl(category.getImageUrl())
                .displayOrder(category.getDisplayOrder())
                .isActive(category.getIsActive())
                .build();
    }

    public MenuDto.FoodItemResponse mapFoodItemToDto(FoodItem item) {
        List<MenuDto.CustomizationGroupResponse> custDtos = item.getCustomizations().stream()
                .map(group -> MenuDto.CustomizationGroupResponse.builder()
                        .id(group.getId())
                        .groupName(group.getGroupName())
                        .isRequired(group.getIsRequired())
                        .allowMultiple(group.getAllowMultiple())
                        .options(group.getOptions().stream()
                                .map(opt -> MenuDto.OptionResponse.builder()
                                        .id(opt.getId())
                                        .name(opt.getName())
                                        .additionalPrice(opt.getAdditionalPrice())
                                        .isDefault(opt.getIsDefault())
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        return MenuDto.FoodItemResponse.builder()
                .id(item.getId())
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : "")
                .stationId(item.getStation() != null ? item.getStation().getId() : null)
                .stationName(item.getStation() != null ? item.getStation().getName() : "Main Kitchen")
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .isVeg(item.getIsVeg())
                .isVegan(item.getIsVegan())
                .isGlutenFree(item.getIsGlutenFree())
                .spiceLevel(item.getSpiceLevel())
                .prepTimeMinutes(item.getPrepTimeMinutes())
                .allergyInfo(item.getAllergyInfo())
                .ingredients(item.getIngredients())
                .isAvailable(item.getIsAvailable())
                .isPopular(item.getIsPopular())
                .isSpecialOffer(item.getIsSpecialOffer())
                .originalPrice(item.getOriginalPrice())
                .customizations(custDtos)
                .build();
    }
}
