package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.CustomizationOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomizationOptionRepository extends JpaRepository<CustomizationOption, Long> {
    List<CustomizationOption> findByCustomizationIdOrderByDisplayOrderAsc(Long customizationId);
}
