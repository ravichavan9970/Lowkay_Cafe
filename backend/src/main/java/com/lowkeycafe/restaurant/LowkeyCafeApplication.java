package com.lowkeycafe.restaurant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LowkeyCafeApplication {

    public static void main(String[] args) {
        SpringApplication.run(LowkeyCafeApplication.class, args);
    }
}
