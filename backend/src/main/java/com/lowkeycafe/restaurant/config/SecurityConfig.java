package com.lowkeycafe.restaurant.config;

import com.lowkeycafe.restaurant.security.AuthEntryPointJwt;
import com.lowkeycafe.restaurant.security.AuthTokenFilter;
import com.lowkeycafe.restaurant.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)) // for H2 console
            .authorizeHttpRequests(auth -> 
                auth
                    // Public customer endpoints
                    .requestMatchers("/error").permitAll()
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/menu/**").permitAll()
                    .requestMatchers("/api/tables/**").permitAll()
                    .requestMatchers("/api/orders/**").permitAll()
                    .requestMatchers("/api/waiter/call", "/api/waiter/requests/table/**").permitAll()
                    .requestMatchers("/api/billing/**").permitAll()
                    .requestMatchers("/api/loyalty/**").permitAll()
                    .requestMatchers("/api/reviews/**").permitAll()
                    .requestMatchers("/api/settings/**").permitAll()
                    .requestMatchers("/api/coupons/**").permitAll()
                    .requestMatchers("/ws/**").permitAll()
                    .requestMatchers("/h2-console/**").permitAll()
                    
                    // Staff & Kitchen endpoints
                    .requestMatchers("/api/kitchen/**").hasAnyRole("ADMIN", "KITCHEN_STAFF")
                    .requestMatchers("/api/waiter/**").hasAnyRole("ADMIN", "WAITER")
                    
                    // Admin only endpoints
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    
                    // Any other request
                    .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
