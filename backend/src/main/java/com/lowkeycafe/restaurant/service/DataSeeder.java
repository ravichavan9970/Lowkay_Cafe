package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.entity.*;
import com.lowkeycafe.restaurant.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantSettingsRepository settingsRepository;
    private final KitchenStationRepository stationRepository;
    private final RestaurantTableRepository tableRepository;
    private final TableQrCodeRepository qrCodeRepository;
    private final FoodCategoryRepository categoryRepository;
    private final FoodItemRepository foodItemRepository;
    private final FoodCustomizationRepository customizationRepository;
    private final CustomizationOptionRepository optionRepository;
    private final CouponRepository couponRepository;
    private final QrCodeService qrCodeService;
    private final PasswordEncoder passwordEncoder;
    private final TableService tableService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedUsers();
        Restaurant restaurant = seedRestaurant();
        Map<String, KitchenStation> stations = seedStations(restaurant);
        seedTables(restaurant);
        seedMenu(restaurant, stations);
        seedFiveDemoDishes(restaurant, stations);
        seedCoupons(restaurant);
        tableService.regenerateAllQrCodes(null);
        log.info("Lowkey Cafe data seeding completed successfully!");
    }

    private void seedRoles() {
        for (RoleType rt : RoleType.values()) {
            roleRepository.findByName(rt).orElseGet(() -> roleRepository.save(Role.builder().name(rt).build()));
        }
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN).orElseThrow();
            Role kitchenRole = roleRepository.findByName(RoleType.ROLE_KITCHEN_STAFF).orElseThrow();
            Role waiterRole = roleRepository.findByName(RoleType.ROLE_WAITER).orElseThrow();
            Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER).orElseThrow();

            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@lowkeycafe.com")
                    .passwordHash(passwordEncoder.encode("admin123"))
                    .fullName("Cafe General Manager")
                    .phone("+91 98765 00001")
                    .roles(Set.of(adminRole))
                    .isActive(true)
                    .build());

            userRepository.save(User.builder()
                    .username("kitchen")
                    .email("kitchen@lowkeycafe.com")
                    .passwordHash(passwordEncoder.encode("kitchen123"))
                    .fullName("Head Chef Mario")
                    .phone("+91 98765 00002")
                    .roles(Set.of(kitchenRole))
                    .isActive(true)
                    .build());

            userRepository.save(User.builder()
                    .username("waiter")
                    .email("waiter@lowkeycafe.com")
                    .passwordHash(passwordEncoder.encode("waiter123"))
                    .fullName("Lead Waiter Alex")
                    .phone("+91 98765 00003")
                    .roles(Set.of(waiterRole))
                    .isActive(true)
                    .build());

            userRepository.save(User.builder()
                    .username("customer")
                    .email("customer@lowkeycafe.com")
                    .passwordHash(passwordEncoder.encode("customer123"))
                    .fullName("Rahul Sharma")
                    .phone("+91 98765 11111")
                    .roles(Set.of(customerRole))
                    .isActive(true)
                    .build());

            log.info("Seeded initial staff accounts: admin, kitchen, waiter, customer (passwords: admin123, kitchen123, waiter123, customer123)");
        }
    }

    private Restaurant seedRestaurant() {
        Restaurant restaurant = restaurantRepository.findAll().stream().findFirst().orElseGet(() ->
                restaurantRepository.save(Restaurant.builder()
                        .name("Lowkey Cafe")
                        .tagline("Artisan Coffee, Gourmet Bites & Good Vibes")
                        .address("742 Evergreen Terrace, Foodie Lane, Metro City")
                        .phone("+91 98765 43210")
                        .email("contact@lowkeycafe.com")
                        .logoUrl("https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80")
                        .isActive(true)
                        .build())
        );

        if (settingsRepository.count() == 0) {
            settingsRepository.save(RestaurantSettings.builder()
                    .restaurant(restaurant)
                    .wifiName("LowkeyCafe_Guest_5G")
                    .wifiPassword("espresso_vibes")
                    .taxPercentage(new BigDecimal("5.00"))
                    .serviceChargePercentage(new BigDecimal("5.00"))
                    .currency("INR")
                    .currencySymbol("₹")
                    .openingTime("09:00 AM")
                    .closingTime("11:00 PM")
                    .pointsPerHundred(new BigDecimal("10.00"))
                    .pointValueRatio(new BigDecimal("1.00"))
                    .paymentGatewayEnabled(true)
                    .autoAcceptOrders(false)
                    .build());
        }

        return restaurant;
    }

    private Map<String, KitchenStation> seedStations(Restaurant restaurant) {
        Map<String, KitchenStation> stationMap = new HashMap<>();
        String[] stationNames = {"Main Kitchen", "Pizza Station", "Beverage Station", "Dessert Station"};

        int order = 1;
        for (String sName : stationNames) {
            final int currOrder = order++;
            KitchenStation station = stationRepository.findAll().stream()
                    .filter(s -> s.getName().equalsIgnoreCase(sName))
                    .findFirst()
                    .orElseGet(() -> stationRepository.save(KitchenStation.builder()
                            .restaurant(restaurant)
                            .name(sName)
                            .description(sName + " line")
                            .displayOrder(currOrder)
                            .isActive(true)
                            .build()));
            stationMap.put(sName, station);
        }
        return stationMap;
    }

    private void seedTables(Restaurant restaurant) {
        if (tableRepository.count() == 0) {
            // Seed Table #0 for Takeaway / Outside Pickup Counter
            RestaurantTable takeawayCounter = RestaurantTable.builder()
                    .restaurant(restaurant)
                    .tableNumber(0)
                    .seatingCapacity(0)
                    .floorZone("Takeaway / Counter")
                    .status("AVAILABLE")
                    .isActive(true)
                    .build();
            tableRepository.save(takeawayCounter);

            for (int i = 1; i <= 10; i++) {
                String zone = (i <= 4) ? "Indoor Lounge" : (i <= 8) ? "Patio Garden" : "Rooftop Terrace";
                int capacity = (i % 3 == 0) ? 6 : (i % 2 == 0) ? 4 : 2;

                RestaurantTable table = RestaurantTable.builder()
                        .restaurant(restaurant)
                        .tableNumber(i)
                        .seatingCapacity(capacity)
                        .floorZone(zone)
                        .status("AVAILABLE")
                        .isActive(true)
                        .build();
                table = tableRepository.save(table);

                String token = "TOKEN-TBL-" + i + "-" + UUID.randomUUID().toString().substring(0, 8);
                String targetUrl = frontendBaseUrl + "/table/" + i + "?token=" + token;
                String qrImageData = qrCodeService.generateQrCodeBase64(targetUrl, 300, 300);

                TableQrCode qr = TableQrCode.builder()
                        .table(table)
                        .accessToken(token)
                        .targetUrl(targetUrl)
                        .qrImageData(qrImageData)
                        .isValid(true)
                        .generatedAt(LocalDateTime.now())
                        .build();
                qrCodeRepository.save(qr);
            }
            log.info("Seeded 10 restaurant tables with valid QR codes");
        }
    }

    private void seedMenu(Restaurant restaurant, Map<String, KitchenStation> stations) {
        if (foodItemRepository.count() > 0) return;

        KitchenStation mainKitchen = stations.get("Main Kitchen");
        KitchenStation pizzaStation = stations.get("Pizza Station");
        KitchenStation beverageStation = stations.get("Beverage Station");
        KitchenStation dessertStation = stations.get("Dessert Station");

        // Categories
        FoodCategory starters = createCategory(restaurant, "Starters", "starters", "Crisp appetizers and finger foods", "Utensils", 1);
        FoodCategory mainCourse = createCategory(restaurant, "Main Course", "main-course", "Hearty pasta, bowls and house specials", "UtensilsCrossed", 2);
        FoodCategory fastFood = createCategory(restaurant, "Fast Food", "fast-food", "Loaded fries, tacos and gourmet bites", "Flame", 3);
        FoodCategory pizza = createCategory(restaurant, "Pizza", "pizza", "Artisanal stone-baked sourdough pizzas", "Pizza", 4);
        FoodCategory burgers = createCategory(restaurant, "Burgers", "burgers", "Brioche smash burgers and sliders", "Sandwich", 5);
        FoodCategory beverages = createCategory(restaurant, "Beverages", "beverages", "Specialty pour-overs, iced teas and brews", "Coffee", 6);
        FoodCategory desserts = createCategory(restaurant, "Desserts", "desserts", "Decadent cakes, tarts and gelato", "Cake", 7);
        FoodCategory specialOffers = createCategory(restaurant, "Special Offers", "special-offers", "Curated chef combos and discounts", "Tag", 8);

        // 1. Starters
        createFoodItem(starters, mainKitchen, "Truffle Parmesan Fries",
                "Crispy shoestring fries tossed in white truffle oil, grated parmesan, and rosemary.",
                new BigDecimal("249.00"), "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
                true, false, true, SpiceLevel.MILD, 10, "Contains Dairy", "Potatoes, Truffle Oil, Parmesan, Rosemary", true, false, null);

        createFoodItem(starters, mainKitchen, "Crispy Korean BBQ Wings",
                "Glazed in sticky gochujang sauce, toasted sesame seeds, and scallions.",
                new BigDecimal("349.00"), "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
                false, false, false, SpiceLevel.HOT, 15, "Contains Sesame, Soy", "Chicken wings, Gochujang, Honey, Garlic, Sesame", true, false, null);

        createFoodItem(starters, mainKitchen, "Avocado Toast Crostini",
                "Sourdough crostini with whipped avocado, cherry tomatoes, feta crumble, and chili flakes.",
                new BigDecimal("289.00"), "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 8, "Contains Gluten, Dairy", "Sourdough, Avocado, Cherry Tomato, Feta, Olive Oil", false, false, null);

        // 2. Pizza
        FoodItem burrataPizza = createFoodItem(pizza, pizzaStation, "Artisan Burrata Margherita",
                "San Marzano tomato sauce, fresh buffalo mozzarella, topped with creamy artisanal burrata and fresh basil.",
                new BigDecimal("499.00"), "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 18, "Contains Gluten, Dairy", "00 Flour, San Marzano Tomatoes, Burrata, Mozzarella, Basil", true, false, null);
        addPizzaCustomizations(burrataPizza);

        FoodItem pepperoniPizza = createFoodItem(pizza, pizzaStation, "Smoked Pepperoni & Hot Honey",
                "Spicy pepperoni cups, aged mozzarella, jalapeño rings, drizzled with house hot honey.",
                new BigDecimal("569.00"), "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
                false, false, false, SpiceLevel.HOT, 18, "Contains Gluten, Dairy, Pork", "Sourdough crust, Pepperoni, Mozzarella, Hot Honey, Jalapeño", true, false, null);
        addPizzaCustomizations(pepperoniPizza);

        FoodItem truffleMushroomPizza = createFoodItem(pizza, pizzaStation, "Wild Forest Mushroom & Truffle",
                "White sauce base, roasted shiitake and button mushrooms, fontina cheese, thyme, white truffle oil.",
                new BigDecimal("529.00"), "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 18, "Contains Gluten, Dairy", "Sourdough, Wild Mushrooms, Fontina, Truffle Oil, Fresh Thyme", false, false, null);
        addPizzaCustomizations(truffleMushroomPizza);

        // 3. Burgers
        FoodItem smashBurger = createFoodItem(burgers, mainKitchen, "Classic Double Smash Cheeseburger",
                "Two juicy smashed beef patties, American cheddar, caramelized onions, pickles, secret Lowkey sauce.",
                new BigDecimal("449.00"), "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
                false, false, false, SpiceLevel.MEDIUM, 14, "Contains Gluten, Dairy, Egg", "Brioche Bun, Beef Patty, Cheddar, House Sauce, Pickles", true, false, null);
        addBurgerCustomizations(smashBurger);

        FoodItem paneerBurger = createFoodItem(burgers, mainKitchen, "Smoked Chipotle Paneer Burger",
                "Crispy panko paneer patty, chipotle aioli, crunchy pickled slaw, and jalapeños on a toasted brioche.",
                new BigDecimal("389.00"), "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.HOT, 12, "Contains Gluten, Dairy", "Brioche, Paneer, Chipotle Aioli, Slaw, Jalapeño", true, false, null);
        addBurgerCustomizations(paneerBurger);

        // 4. Main Course
        createFoodItem(mainCourse, mainKitchen, "Creamy Truffle Tagliatelle",
                "Handmade egg pasta ribbons in a silky truffle parmesan cream sauce with wild garlic.",
                new BigDecimal("479.00"), "https://images.unsplash.com/photo-1621996346565-e3d5d6281788?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 16, "Contains Gluten, Dairy, Egg", "Tagliatelle, Heavy Cream, Truffle Paste, Parmesan, Garlic", true, false, null);

        createFoodItem(mainCourse, mainKitchen, "Pan-Seared Herb Butter Salmon",
                "Crispy skin Atlantic salmon fillet with lemon herb butter sauce, served over garlic mashed potatoes.",
                new BigDecimal("699.00"), "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80",
                false, false, true, SpiceLevel.MILD, 20, "Contains Fish, Dairy", "Salmon, Potatoes, Butter, Rosemary, Garlic, Lemon", true, false, null);

        // 5. Fast Food
        createFoodItem(fastFood, mainKitchen, "Loaded Cheesy Nachos Supreme",
                "Crisp corn tortilla chips piled high with warm queso, black beans, pico de gallo, guacamole, and sour cream.",
                new BigDecimal("329.00"), "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80",
                true, false, true, SpiceLevel.MEDIUM, 10, "Contains Dairy", "Corn Tortillas, Cheddar Queso, Black Beans, Guacamole, Sour Cream", true, false, null);

        // 6. Beverages
        FoodItem icedLatte = createFoodItem(beverages, beverageStation, "Iced Spanish Vanilla Latte",
                "Double shot espresso with condensed milk, vanilla bean extract, and cold textured whole milk over crystal ice.",
                new BigDecimal("239.00"), "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
                true, false, true, SpiceLevel.MILD, 5, "Contains Dairy", "Espresso, Condensed Milk, Whole Milk, Vanilla Bean", true, false, null);
        addCoffeeCustomizations(icedLatte);

        FoodItem matchaLatte = createFoodItem(beverages, beverageStation, "Ceremonial Uji Matcha Latte",
                "Grade A ceremonial Uji matcha whisked with oat milk and a touch of organic agave.",
                new BigDecimal("269.00"), "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
                true, true, true, SpiceLevel.MILD, 5, "Gluten-Free, Dairy-Free", "Ceremonial Matcha, Oat Milk, Agave", true, false, null);
        addCoffeeCustomizations(matchaLatte);

        createFoodItem(beverages, beverageStation, "Yuzu Mint Cold Brew",
                "18-hour cold brew infused with Japanese yuzu juice, crushed mint, and sparkling tonic water.",
                new BigDecimal("249.00"), "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
                true, true, true, SpiceLevel.MILD, 4, null, "Cold Brew Coffee, Yuzu Puree, Fresh Mint, Tonic", false, false, null);

        // 7. Desserts
        createFoodItem(desserts, dessertStation, "Molten Chocolate Lava Cake",
                "Warm Valrhona dark chocolate cake with a molten center, served with Madagascan vanilla bean gelato.",
                new BigDecimal("299.00"), "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 12, "Contains Gluten, Dairy, Egg", "Valrhona Chocolate, Butter, Sugar, Eggs, Vanilla Gelato", true, false, null);

        createFoodItem(desserts, dessertStation, "Classic Italian Tiramisu",
                "Espresso-soaked savoiardi biscuits layered with light mascarpone cream and dusted with cocoa.",
                new BigDecimal("289.00"), "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 5, "Contains Gluten, Dairy, Egg", "Savoiardi, Espresso, Mascarpone, Cocoa", true, false, null);

        // 8. Special Offers
        createFoodItem(specialOffers, mainKitchen, "Lowkey Combo: Smash Burger + Fries + Latte",
                "Chef special value bundle: Double Smash Burger with Truffle Fries and Iced Spanish Latte.",
                new BigDecimal("749.00"), "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
                false, false, false, SpiceLevel.MEDIUM, 18, "Contains Gluten, Dairy", "Smash Burger, Truffle Fries, Iced Latte", true, true, new BigDecimal("937.00"));

        createFoodItem(specialOffers, pizzaStation, "Pizza Party Combo: 2 Pizzas + 2 Mocktails",
                "Any 2 artisan sourdough pizzas accompanied by two refreshing cold brew coolers.",
                new BigDecimal("1099.00"), "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
                true, false, false, SpiceLevel.MILD, 20, "Contains Gluten, Dairy", "Margherita + Truffle Mushroom + 2 Cold Brews", true, true, new BigDecimal("1377.00"));

        log.info("Seeded 16 gourmet food items across 8 categories with rich metadata and customizations");
    }

    private FoodCategory createCategory(Restaurant restaurant, String name, String slug, String desc, String icon, int order) {
        return categoryRepository.save(FoodCategory.builder()
                .restaurant(restaurant)
                .name(name)
                .slug(slug)
                .description(desc)
                .iconName(icon)
                .displayOrder(order)
                .isActive(true)
                .build());
    }

    private FoodItem createFoodItem(FoodCategory category, KitchenStation station, String name, String desc,
                                   BigDecimal price, String imgUrl, boolean veg, boolean vegan, boolean glutenFree,
                                   SpiceLevel spice, int prepTime, String allergy, String ingredients,
                                   boolean popular, boolean special, BigDecimal originalPrice) {
        return foodItemRepository.save(FoodItem.builder()
                .category(category)
                .station(station)
                .name(name)
                .description(desc)
                .price(price)
                .imageUrl(imgUrl)
                .isVeg(veg)
                .isVegan(vegan)
                .isGlutenFree(glutenFree)
                .spiceLevel(spice)
                .prepTimeMinutes(prepTime)
                .allergyInfo(allergy)
                .ingredients(ingredients)
                .isAvailable(true)
                .isPopular(popular)
                .isSpecialOffer(special)
                .originalPrice(originalPrice)
                .build());
    }

    private void addPizzaCustomizations(FoodItem item) {
        FoodCustomization sizeGroup = customizationRepository.save(FoodCustomization.builder()
                .foodItem(item)
                .groupName("Size & Crust")
                .isRequired(true)
                .allowMultiple(false)
                .displayOrder(1)
                .build());

        optionRepository.save(CustomizationOption.builder().customization(sizeGroup).name("10\" Regular Sourdough").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
        optionRepository.save(CustomizationOption.builder().customization(sizeGroup).name("12\" Large Sourdough").additionalPrice(new BigDecimal("149.00")).build());
        optionRepository.save(CustomizationOption.builder().customization(sizeGroup).name("Cheese Stuffed Crust").additionalPrice(new BigDecimal("99.00")).build());

        FoodCustomization toppings = customizationRepository.save(FoodCustomization.builder()
                .foodItem(item)
                .groupName("Extra Toppings")
                .isRequired(false)
                .allowMultiple(true)
                .displayOrder(2)
                .build());

        optionRepository.save(CustomizationOption.builder().customization(toppings).name("Extra Buffalo Mozzarella").additionalPrice(new BigDecimal("79.00")).build());
        optionRepository.save(CustomizationOption.builder().customization(toppings).name("Spicy Jalapeños").additionalPrice(new BigDecimal("39.00")).build());
        optionRepository.save(CustomizationOption.builder().customization(toppings).name("Hot Honey Drizzle").additionalPrice(new BigDecimal("49.00")).build());
    }

    private void addBurgerCustomizations(FoodItem item) {
        FoodCustomization portion = customizationRepository.save(FoodCustomization.builder()
                .foodItem(item)
                .groupName("Portion Size")
                .isRequired(true)
                .allowMultiple(false)
                .displayOrder(1)
                .build());

        optionRepository.save(CustomizationOption.builder().customization(portion).name("Single Patty").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
        optionRepository.save(CustomizationOption.builder().customization(portion).name("Double Patty (+₹120)").additionalPrice(new BigDecimal("120.00")).build());

        FoodCustomization addOns = customizationRepository.save(FoodCustomization.builder()
                .foodItem(item)
                .groupName("Add-ons")
                .isRequired(false)
                .allowMultiple(true)
                .displayOrder(2)
                .build());

        optionRepository.save(CustomizationOption.builder().customization(addOns).name("Extra Sharp Cheddar").additionalPrice(new BigDecimal("49.00")).build());
        optionRepository.save(CustomizationOption.builder().customization(addOns).name("Crispy Bacon Strips").additionalPrice(new BigDecimal("89.00")).build());
        optionRepository.save(CustomizationOption.builder().customization(addOns).name("Truffle Mayo Dip").additionalPrice(new BigDecimal("39.00")).build());
    }

    private void addCoffeeCustomizations(FoodItem item) {
        FoodCustomization milkChoice = customizationRepository.save(FoodCustomization.builder()
                .foodItem(item)
                .groupName("Milk Option")
                .isRequired(true)
                .allowMultiple(false)
                .displayOrder(1)
                .build());

        optionRepository.save(CustomizationOption.builder().customization(milkChoice).name("Whole Milk").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
        optionRepository.save(CustomizationOption.builder().customization(milkChoice).name("Oat Milk (Vegan)").additionalPrice(new BigDecimal("45.00")).build());
        optionRepository.save(CustomizationOption.builder().customization(milkChoice).name("Almond Milk").additionalPrice(new BigDecimal("45.00")).build());

        FoodCustomization sweetness = customizationRepository.save(FoodCustomization.builder()
                .foodItem(item)
                .groupName("Sweetness Level")
                .isRequired(false)
                .allowMultiple(false)
                .displayOrder(2)
                .build());

        optionRepository.save(CustomizationOption.builder().customization(sweetness).name("Regular Sweet").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
        optionRepository.save(CustomizationOption.builder().customization(sweetness).name("Less Sweet (50%)").additionalPrice(BigDecimal.ZERO).build());
        optionRepository.save(CustomizationOption.builder().customization(sweetness).name("No Sugar").additionalPrice(BigDecimal.ZERO).build());
    }

    private void seedFiveDemoDishes(Restaurant restaurant, Map<String, KitchenStation> stations) {
        KitchenStation mainKitchen = stations.get("Main Kitchen");
        KitchenStation pizzaStation = stations.get("Pizza Station");
        KitchenStation dessertStation = stations.get("Dessert Station");

        FoodCategory starters = categoryRepository.findBySlug("starters").orElse(null);
        FoodCategory mainCourse = categoryRepository.findBySlug("main-course").orElse(null);
        FoodCategory burgers = categoryRepository.findBySlug("burgers").orElse(null);
        FoodCategory pizza = categoryRepository.findBySlug("pizza").orElse(null);
        FoodCategory desserts = categoryRepository.findBySlug("desserts").orElse(null);

        // 1. Firecracker Crispy Calamari
        if (!foodItemRepository.existsByName("Firecracker Crispy Calamari") && starters != null) {
            FoodItem calamari = createFoodItem(starters, mainKitchen, "Firecracker Crispy Calamari",
                    "Tender golden calamari rings dusted in Japanese togarashi spice, cilantro, lime wedges, and house smoked chili aioli.",
                    new BigDecimal("379.00"), "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
                    false, false, false, SpiceLevel.HOT, 12, "Contains Seafood, Egg, Sesame", "Calamari Rings, Togarashi Spice, Lime, Cilantro, Smoked Chili Aioli", true, false, null);

            FoodCustomization dipGroup = customizationRepository.save(FoodCustomization.builder()
                    .foodItem(calamari)
                    .groupName("Dip Selection")
                    .isRequired(true)
                    .allowMultiple(false)
                    .displayOrder(1)
                    .build());
            optionRepository.save(CustomizationOption.builder().customization(dipGroup).name("Smoked Chili Aioli").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
            optionRepository.save(CustomizationOption.builder().customization(dipGroup).name("Truffle Garlic Mayo").additionalPrice(new BigDecimal("39.00")).build());
            optionRepository.save(CustomizationOption.builder().customization(dipGroup).name("Sweet Plum Glaze").additionalPrice(new BigDecimal("29.00")).build());
        }

        // 2. Wood-Fired Pesto Burrata Gnocchi
        if (!foodItemRepository.existsByName("Wood-Fired Pesto Burrata Gnocchi") && mainCourse != null) {
            FoodItem gnocchi = createFoodItem(mainCourse, mainKitchen, "Wood-Fired Pesto Burrata Gnocchi",
                    "Pan-seared potato gnocchi tossed in genovese basil pesto, blistered cherry tomatoes, topped with a fresh whole artisanal burrata ball.",
                    new BigDecimal("549.00"), "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
                    true, false, false, SpiceLevel.MILD, 15, "Contains Dairy, Pine Nuts, Gluten", "Potato Gnocchi, Basil Pesto, Whole Burrata, Cherry Tomatoes, Pine Nuts", true, false, null);

            FoodCustomization cheeseGroup = customizationRepository.save(FoodCustomization.builder()
                    .foodItem(gnocchi)
                    .groupName("Cheese Options")
                    .isRequired(false)
                    .allowMultiple(true)
                    .displayOrder(1)
                    .build());
            optionRepository.save(CustomizationOption.builder().customization(cheeseGroup).name("Extra Burrata Ball (+₹149)").additionalPrice(new BigDecimal("149.00")).build());
            optionRepository.save(CustomizationOption.builder().customization(cheeseGroup).name("Shaved 24M Aged Parmesan").additionalPrice(new BigDecimal("59.00")).build());
        }

        // 3. Nashville Hot Honey Fried Chicken Sandwich
        if (!foodItemRepository.existsByName("Nashville Hot Honey Fried Chicken Sandwich") && burgers != null) {
            FoodItem chickenSandwich = createFoodItem(burgers, mainKitchen, "Nashville Hot Honey Fried Chicken Sandwich",
                    "Buttermilk fried chicken breast dipped in Nashville cayenne oil, glazed with wildflower hot honey, house pickles, and slaw on brioche.",
                    new BigDecimal("469.00"), "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
                    false, false, false, SpiceLevel.EXTRA_HOT, 14, "Contains Gluten, Dairy, Egg", "Buttermilk Fried Chicken, Brioche Bun, Nashville Cayenne Oil, Hot Honey, Dill Pickles, Slaw", true, true, new BigDecimal("529.00"));

            FoodCustomization heatGroup = customizationRepository.save(FoodCustomization.builder()
                    .foodItem(chickenSandwich)
                    .groupName("Heat Level")
                    .isRequired(true)
                    .allowMultiple(false)
                    .displayOrder(1)
                    .build());
            optionRepository.save(CustomizationOption.builder().customization(heatGroup).name("Medium Kick").additionalPrice(BigDecimal.ZERO).build());
            optionRepository.save(CustomizationOption.builder().customization(heatGroup).name("Nashville Hot").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
            optionRepository.save(CustomizationOption.builder().customization(heatGroup).name("Ghost Pepper Extreme (+₹20)").additionalPrice(new BigDecimal("20.00")).build());
        }

        // 4. Quattro Formaggi & Truffle Wildflower Pizza
        if (!foodItemRepository.existsByName("Quattro Formaggi & Truffle Wildflower Pizza") && pizza != null) {
            FoodItem quattroPizza = createFoodItem(pizza, pizzaStation, "Quattro Formaggi & Truffle Wildflower Pizza",
                    "Artisanal sourdough crust with Fior di Latte mozzarella, gorgonzola dolce, smoked scamorza, pecorino romano, white truffle oil, and walnuts.",
                    new BigDecimal("589.00"), "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=600&q=80",
                    true, false, false, SpiceLevel.MILD, 18, "Contains Gluten, Dairy, Walnuts", "Sourdough, Fior di Latte, Gorgonzola, Scamorza, Pecorino, Truffle Oil, Walnuts", true, false, null);
            addPizzaCustomizations(quattroPizza);
        }

        // 5. Signature Biscoff Lotus Basque Cheesecake
        if (!foodItemRepository.existsByName("Signature Biscoff Lotus Basque Cheesecake") && desserts != null) {
            FoodItem cheesecake = createFoodItem(desserts, dessertStation, "Signature Biscoff Lotus Basque Cheesecake",
                    "Caramelized San Sebastian Basque cheesecake with a molten center, smothered in warm Lotus Biscoff spread and spiced cookie crumble.",
                    new BigDecimal("329.00"), "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
                    true, false, false, SpiceLevel.MILD, 6, "Contains Dairy, Gluten, Egg", "Cream Cheese, Heavy Cream, Sugar, Eggs, Lotus Biscoff, Caramelized Biscuits", true, false, null);

            FoodCustomization dessertGroup = customizationRepository.save(FoodCustomization.builder()
                    .foodItem(cheesecake)
                    .groupName("Serving Style")
                    .isRequired(true)
                    .allowMultiple(false)
                    .displayOrder(1)
                    .build());
            optionRepository.save(CustomizationOption.builder().customization(dessertGroup).name("Classic Slice").additionalPrice(BigDecimal.ZERO).isDefault(true).build());
            optionRepository.save(CustomizationOption.builder().customization(dessertGroup).name("A La Mode (+Madagascan Vanilla Gelato)").additionalPrice(new BigDecimal("69.00")).build());
            optionRepository.save(CustomizationOption.builder().customization(dessertGroup).name("Double Lotus Biscoff Spread Drizzle").additionalPrice(new BigDecimal("39.00")).build());
        }

        log.info("5 Demo dishes successfully verified/seeded in menu!");
    }

    private void seedCoupons(Restaurant restaurant) {
        if (couponRepository.count() == 0) {
            couponRepository.save(Coupon.builder()
                    .restaurant(restaurant)
                    .code("WELCOME10")
                    .discountPercentage(new BigDecimal("10.00"))
                    .maxDiscountAmount(new BigDecimal("100.00"))
                    .minOrderAmount(new BigDecimal("299.00"))
                    .isActive(true)
                    .build());

            couponRepository.save(Coupon.builder()
                    .restaurant(restaurant)
                    .code("LOWKEY20")
                    .discountPercentage(new BigDecimal("20.00"))
                    .maxDiscountAmount(new BigDecimal("200.00"))
                    .minOrderAmount(new BigDecimal("599.00"))
                    .isActive(true)
                    .build());

            couponRepository.save(Coupon.builder()
                    .restaurant(restaurant)
                    .code("TASTY50")
                    .discountPercentage(new BigDecimal("50.00"))
                    .maxDiscountAmount(new BigDecimal("150.00"))
                    .minOrderAmount(new BigDecimal("499.00"))
                    .isActive(true)
                    .build());

            log.info("Seeded coupons: WELCOME10, LOWKEY20, TASTY50");
        }
    }
}
