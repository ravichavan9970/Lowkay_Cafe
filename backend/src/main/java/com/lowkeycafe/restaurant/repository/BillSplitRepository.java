package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.BillSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillSplitRepository extends JpaRepository<BillSplit, Long> {
    List<BillSplit> findByBillIdOrderBySplitNumberAsc(Long billId);
}
