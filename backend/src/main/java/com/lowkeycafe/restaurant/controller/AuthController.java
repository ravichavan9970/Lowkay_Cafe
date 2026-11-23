package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.AuthDto;
import com.lowkeycafe.restaurant.entity.Role;
import com.lowkeycafe.restaurant.entity.RoleType;
import com.lowkeycafe.restaurant.entity.User;
import com.lowkeycafe.restaurant.repository.RoleRepository;
import com.lowkeycafe.restaurant.repository.UserRepository;
import com.lowkeycafe.restaurant.security.JwtUtils;
import com.lowkeycafe.restaurant.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthDto.LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(AuthDto.AuthResponse.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .fullName(userDetails.getFullName())
                .roles(roles)
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthDto.RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .fullName(signUpRequest.getFullName())
                .phone(signUpRequest.getPhone())
                .passwordHash(encoder.encode(signUpRequest.getPassword()))
                .isActive(true)
                .build();

        Set<Role> roles = new HashSet<>();
        String strRole = signUpRequest.getRole();

        if (strRole == null || strRole.isBlank()) {
            Role customerRole = roleRepository.findByName(RoleType.ROLE_CUSTOMER).orElseThrow();
            roles.add(customerRole);
        } else {
            switch (strRole.toUpperCase()) {
                case "ADMIN" -> roles.add(roleRepository.findByName(RoleType.ROLE_ADMIN).orElseThrow());
                case "KITCHEN", "KITCHEN_STAFF" -> roles.add(roleRepository.findByName(RoleType.ROLE_KITCHEN_STAFF).orElseThrow());
                case "WAITER" -> roles.add(roleRepository.findByName(RoleType.ROLE_WAITER).orElseThrow());
                default -> roles.add(roleRepository.findByName(RoleType.ROLE_CUSTOMER).orElseThrow());
            }
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl userDetails)) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(AuthDto.AuthResponse.builder()
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .fullName(userDetails.getFullName())
                .roles(roles)
                .build());
    }
}
