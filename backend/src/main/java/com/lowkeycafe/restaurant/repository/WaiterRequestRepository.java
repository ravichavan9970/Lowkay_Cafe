package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.WaiterRequest;
import com.lowkeycafe.restaurant.entity.WaiterRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WaiterRequestRepository extends JpaRepository<WaiterRequest, Long> {
    List<WaiterRequest> findByStatusOrderByRequestedAtAsc(WaiterRequestStatus status);
    List<WaiterRequest> findByTableTableNumberOrderByRequestedAtDesc(Integer tableNumber);
    List<WaiterRequest> findByStatusInOrderByRequestedAtAsc(List<WaiterRequestStatus> statuses);
    Long countByStatus(WaiterRequestStatus status);
}
