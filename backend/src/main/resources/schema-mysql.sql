-- =========================================================================
-- LOWKEY CAFE - SMART RESTAURANT MANAGEMENT & QR-BASED ORDERING SYSTEM
-- Complete MySQL 8 Relational Database Schema
-- =========================================================================

CREATE DATABASE IF NOT EXISTS lowkeycafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lowkeycafe;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. RESTAURANTS
DROP TABLE IF EXISTS restaurants;
CREATE TABLE restaurants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USERS
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. ROLES
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. USER_ROLES
DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. RESTAURANT_SETTINGS
DROP TABLE IF EXISTS restaurant_settings;
CREATE TABLE restaurant_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    wifi_name VARCHAR(100) DEFAULT 'LowkeyCafe_Guest',
    wifi_password VARCHAR(100) DEFAULT 'espresso_vibes',
    tax_percentage DECIMAL(5, 2) DEFAULT 5.00,
    service_charge_percentage DECIMAL(5, 2) DEFAULT 5.00,
    currency VARCHAR(10) DEFAULT 'INR',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    opening_time VARCHAR(20) DEFAULT '09:00 AM',
    closing_time VARCHAR(20) DEFAULT '11:00 PM',
    points_per_hundred DECIMAL(5, 2) DEFAULT 10.00,
    point_value_ratio DECIMAL(5, 2) DEFAULT 1.00,
    payment_gateway_enabled BOOLEAN DEFAULT TRUE,
    auto_accept_orders BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rs_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. RESTAURANT_TABLES
DROP TABLE IF EXISTS restaurant_tables;
CREATE TABLE restaurant_tables (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    table_number INT NOT NULL UNIQUE,
    seating_capacity INT NOT NULL DEFAULT 4,
    floor_zone VARCHAR(50) DEFAULT 'Main Dining',
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, ORDERING, ORDER_RECEIVED, PREPARING, FOOD_READY, ASSISTANCE_REQUESTED, BILLING_REQUESTED
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABLE_QR_CODES
DROP TABLE IF EXISTS table_qr_codes;
CREATE TABLE table_qr_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_id BIGINT NOT NULL UNIQUE,
    access_token VARCHAR(255) NOT NULL UNIQUE,
    target_url VARCHAR(500) NOT NULL,
    qr_image_data LONGTEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_tqc_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. KITCHEN_STATIONS
DROP TABLE IF EXISTS kitchen_stations;
CREATE TABLE kitchen_stations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL, -- Main Kitchen, Pizza Station, Beverage Station, Dessert Station
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 1,
    CONSTRAINT fk_ks_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. FOOD_CATEGORIES
DROP TABLE IF EXISTS food_categories;
CREATE TABLE food_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL, -- Starters, Main Course, Fast Food, Pizza, Burgers, Beverages, Desserts, Special Offers
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    image_url VARCHAR(500),
    display_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_fc_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. FOOD_ITEMS
DROP TABLE IF EXISTS food_items;
CREATE TABLE food_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    is_veg BOOLEAN DEFAULT TRUE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    spice_level VARCHAR(20) DEFAULT 'MEDIUM', -- MILD, MEDIUM, HOT, EXTRA_HOT
    prep_time_minutes INT DEFAULT 15,
    allergy_info VARCHAR(255),
    ingredients TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_special_offer BOOLEAN DEFAULT FALSE,
    original_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fi_category FOREIGN KEY (category_id) REFERENCES food_categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. STATION_FOOD_ITEMS
DROP TABLE IF EXISTS station_food_items;
CREATE TABLE station_food_items (
    station_id BIGINT NOT NULL,
    food_item_id BIGINT NOT NULL,
    PRIMARY KEY (station_id, food_item_id),
    CONSTRAINT fk_sfi_station FOREIGN KEY (station_id) REFERENCES kitchen_stations (id) ON DELETE CASCADE,
    CONSTRAINT fk_sfi_food FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. FOOD_CUSTOMIZATIONS
DROP TABLE IF EXISTS food_customizations;
CREATE TABLE food_customizations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    food_item_id BIGINT NOT NULL,
    group_name VARCHAR(100) NOT NULL, -- Portion Size, Extra Toppings, Add-ons, Spice Level
    is_required BOOLEAN DEFAULT FALSE,
    allow_multiple BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 1,
    CONSTRAINT fk_fcust_food FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. CUSTOMIZATION_OPTIONS
DROP TABLE IF EXISTS customization_options;
CREATE TABLE customization_options (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customization_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL, -- Regular, Large, Extra Cheese, Jalapenos, Oat Milk
    additional_price DECIMAL(10, 2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 1,
    CONSTRAINT fk_co_cust FOREIGN KEY (customization_id) REFERENCES food_customizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. COUPONS
DROP TABLE IF EXISTS coupons;
CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    max_discount_amount DECIMAL(10, 2),
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INT DEFAULT 1000,
    times_used INT DEFAULT 0,
    CONSTRAINT fk_c_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. CUSTOMER_PROFILES
DROP TABLE IF EXISTS customer_profiles;
CREATE TABLE customer_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150),
    phone VARCHAR(30) UNIQUE,
    email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. LOYALTY_POINTS
DROP TABLE IF EXISTS loyalty_points;
CREATE TABLE loyalty_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL UNIQUE,
    points_balance INT DEFAULT 0,
    lifetime_points_earned INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lp_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. ORDERS
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. ORD-2026-1001
    table_id BIGINT NOT NULL,
    customer_id BIGINT,
    customer_name VARCHAR(150) DEFAULT 'Guest Diner',
    customer_phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'NEW_ORDER', -- NEW_ORDER, ACCEPTED, PREPARING, READY, SERVED, COMPLETED, CANCELLED
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    service_charge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    applied_coupon_code VARCHAR(50),
    grand_total DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    estimated_prep_minutes INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    preparing_at TIMESTAMP NULL,
    ready_at TIMESTAMP NULL,
    served_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,
    CONSTRAINT fk_ord_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id) ON DELETE CASCADE,
    CONSTRAINT fk_ord_cust FOREIGN KEY (customer_id) REFERENCES customer_profiles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. ORDER_ITEMS
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    food_item_id BIGINT NOT NULL,
    station_id BIGINT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    selected_portion VARCHAR(50) DEFAULT 'Regular',
    selected_spice_level VARCHAR(20) DEFAULT 'MEDIUM',
    removed_ingredients TEXT,
    item_notes TEXT,
    status VARCHAR(30) DEFAULT 'NEW_ORDER', -- NEW_ORDER, PREPARING, READY, SERVED
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_food FOREIGN KEY (food_item_id) REFERENCES food_items (id),
    CONSTRAINT fk_oi_station FOREIGN KEY (station_id) REFERENCES kitchen_stations (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. ORDER_ITEM_CUSTOMIZATIONS
DROP TABLE IF EXISTS order_item_customizations;
CREATE TABLE order_item_customizations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT NOT NULL,
    option_id BIGINT,
    group_name VARCHAR(100),
    option_name VARCHAR(100) NOT NULL,
    additional_price DECIMAL(10, 2) DEFAULT 0.00,
    CONSTRAINT fk_oic_item FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE CASCADE,
    CONSTRAINT fk_oic_option FOREIGN KEY (option_id) REFERENCES customization_options (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. KITCHEN_ORDER_TRACKING
DROP TABLE IF EXISTS kitchen_order_tracking;
CREATE TABLE kitchen_order_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    station_id BIGINT NOT NULL,
    assigned_cook_id BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'NEW_ORDER',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    delayed BOOLEAN DEFAULT FALSE,
    delay_reason VARCHAR(255),
    CONSTRAINT fk_kot_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_kot_station FOREIGN KEY (station_id) REFERENCES kitchen_stations (id) ON DELETE CASCADE,
    CONSTRAINT fk_kot_cook FOREIGN KEY (assigned_cook_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. WAITER_REQUESTS
DROP TABLE IF EXISTS waiter_requests;
CREATE TABLE waiter_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_id BIGINT NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- ASSISTANCE, WATER, EXTRA_PLATES, MENU_HELP, BILL_REQUEST, OTHER
    additional_note TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, RESOLVED
    assigned_waiter_id BIGINT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    CONSTRAINT fk_wr_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id) ON DELETE CASCADE,
    CONSTRAINT fk_wr_waiter FOREIGN KEY (assigned_waiter_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. STAFF_ASSIGNMENTS
DROP TABLE IF EXISTS staff_assignments;
CREATE TABLE staff_assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_user_id BIGINT NOT NULL,
    table_id BIGINT,
    floor_zone VARCHAR(50),
    shift_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_sa_user FOREIGN KEY (staff_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_sa_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. BILLS
DROP TABLE IF EXISTS bills;
CREATE TABLE bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    table_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    service_charge DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tip_amount DECIMAL(10, 2) DEFAULT 0.00,
    loyalty_discount DECIMAL(10, 2) DEFAULT 0.00,
    final_payable_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PARTIALLY_PAID, PAID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    CONSTRAINT fk_b_table FOREIGN KEY (table_id) REFERENCES restaurant_tables (id),
    CONSTRAINT fk_b_order FOREIGN KEY (order_id) REFERENCES orders (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. BILL_ITEMS
DROP TABLE IF EXISTS bill_items;
CREATE TABLE bill_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    order_item_id BIGINT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_bi_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE,
    CONSTRAINT fk_bi_order_item FOREIGN KEY (order_item_id) REFERENCES order_items (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 25. BILL_SPLITS
DROP TABLE IF EXISTS bill_splits;
CREATE TABLE bill_splits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    split_number INT NOT NULL,
    split_type VARCHAR(30) NOT NULL, -- EQUAL, BY_ITEM, CUSTOM_AMOUNT
    allocated_amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    payer_name VARCHAR(100),
    payment_method VARCHAR(30),
    paid_at TIMESTAMP NULL,
    CONSTRAINT fk_bs_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 26. TIPS
DROP TABLE IF EXISTS tips;
CREATE TABLE tips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    tip_type VARCHAR(20) NOT NULL, -- PERCENTAGE, CUSTOM, NONE
    percentage_value DECIMAL(5, 2),
    tip_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tip_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. PAYMENTS
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_reference VARCHAR(100) NOT NULL UNIQUE,
    bill_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- UPI, CARD, CASH, RAZORPAY
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED, REFUNDED
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100),
    gateway_signature VARCHAR(255),
    collected_by_staff_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    CONSTRAINT fk_pay_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_staff FOREIGN KEY (collected_by_staff_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. PAYMENT_TRANSACTIONS
DROP TABLE IF EXISTS payment_transactions;
CREATE TABLE payment_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    transaction_code VARCHAR(100) NOT NULL UNIQUE,
    gateway_name VARCHAR(50) DEFAULT 'RAZORPAY',
    payload_request TEXT,
    payload_response TEXT,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pt_pay FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. LOYALTY_TRANSACTIONS
DROP TABLE IF EXISTS loyalty_transactions;
CREATE TABLE loyalty_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    order_id BIGINT,
    transaction_type VARCHAR(20) NOT NULL, -- EARNED, REDEEMED
    points INT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lt_customer FOREIGN KEY (customer_id) REFERENCES customer_profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_lt_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 30. RECEIPTS
DROP TABLE IF EXISTS receipts;
CREATE TABLE receipts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    bill_id BIGINT NOT NULL UNIQUE,
    pdf_path VARCHAR(500),
    emailed_to VARCHAR(150),
    email_sent_at TIMESTAMP NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31. REVIEWS
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE,
    customer_id BIGINT,
    food_rating INT NOT NULL CHECK (food_rating BETWEEN 1 AND 5),
    service_rating INT NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
    cleanliness_rating INT NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_cust FOREIGN KEY (customer_id) REFERENCES customer_profiles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 32. NOTIFICATIONS
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_role VARCHAR(50) NOT NULL, -- KITCHEN_STAFF, WAITER, ADMIN, CUSTOMER
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- NEW_ORDER, CALL_WAITER, FOOD_READY, PAYMENT_DONE
    related_entity_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 33. AUDIT_LOGS
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_table ON orders (table_id);
CREATE INDEX idx_waiter_requests_status ON waiter_requests (status);
CREATE INDEX idx_kitchen_tracking_status ON kitchen_order_tracking (status);
CREATE INDEX idx_bills_status ON bills (status);
CREATE INDEX idx_food_items_category ON food_items (category_id);
