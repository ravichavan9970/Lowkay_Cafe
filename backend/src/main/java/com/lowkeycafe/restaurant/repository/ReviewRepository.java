package com.lowkeycafe.restaurant.repository;

import com.lowkeycafe.restaurant.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByOrderId(Long orderId);
    List<Review> findByIsPublicTrueOrderByCreatedAtDesc();

    @Query("SELECT AVG(r.overallRating), AVG(r.foodRating), AVG(r.serviceRating), AVG(r.cleanlinessRating) FROM Review r")
    Object[] getAverageRatings();
}
