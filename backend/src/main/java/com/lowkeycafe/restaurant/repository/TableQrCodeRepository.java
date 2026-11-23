package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.RestaurantTable;
import com.lowkeycafe.restaurant.entity.TableQrCode;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableQrCodeRepository extends JpaRepository<TableQrCode, Long> {
    @EntityGraph(attributePaths = {"table"})
    Optional<TableQrCode> findByAccessToken(String accessToken);

    @EntityGraph(attributePaths = {"table"})
    Optional<TableQrCode> findByTable(RestaurantTable table);

    @EntityGraph(attributePaths = {"table"})
    Optional<TableQrCode> findByTableTableNumber(Integer tableNumber);
}
