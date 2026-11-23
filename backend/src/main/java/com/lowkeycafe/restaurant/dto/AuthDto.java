package com.lowkeycafe.restaurant.dto;

import lombok.*;

import java.util.List;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String fullName;
        private String phone;
        private String role; // ADMIN, KITCHEN_STAFF, WAITER, CUSTOMER
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthResponse {
        private String token;
        @Builder.Default
        private String type = "Bearer";
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private List<String> roles;
    }
}
