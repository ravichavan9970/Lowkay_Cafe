package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.StaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffAssignmentRepository extends JpaRepository<StaffAssignment, Long> {
    List<StaffAssignment> findByShiftDateAndIsActiveTrue(LocalDate shiftDate);
    List<StaffAssignment> findByStaffUserIdAndIsActiveTrue(Long staffUserId);
}
