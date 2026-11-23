package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Role;
import com.lowkeycafe.restaurant.entity.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleType name);
}
