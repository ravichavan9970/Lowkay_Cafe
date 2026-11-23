package com.lowkeycafe.restaurant.service;

import com.lowkeycafe.restaurant.dto.ReviewDto;
import com.lowkeycafe.restaurant.entity.CustomerProfile;
import com.lowkeycafe.restaurant.entity.Order;
import com.lowkeycafe.restaurant.entity.Review;
import com.lowkeycafe.restaurant.repository.CustomerProfileRepository;
import com.lowkeycafe.restaurant.repository.OrderRepository;
import com.lowkeycafe.restaurant.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final CustomerProfileRepository customerRepository;

    @Transactional
    public ReviewDto.ReviewResponse submitReview(ReviewDto.CreateReviewRequest request) {
        Order order = orderRepository.findByOrderCode(request.getOrderCode())
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + request.getOrderCode()));

        // Prevent duplicate review for the same order
        if (reviewRepository.findByOrderId(order.getId()).isPresent()) {
            throw new IllegalStateException("A review has already been submitted for this order");
        }

        CustomerProfile customer = null;
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            customer = customerRepository.findByPhone(request.getCustomerPhone()).orElse(null);
        }

        Review review = Review.builder()
                .order(order)
                .customer(customer)
                .foodRating(Math.max(1, Math.min(5, request.getFoodRating() != null ? request.getFoodRating() : 5)))
                .serviceRating(Math.max(1, Math.min(5, request.getServiceRating() != null ? request.getServiceRating() : 5)))
                .cleanlinessRating(Math.max(1, Math.min(5, request.getCleanlinessRating() != null ? request.getCleanlinessRating() : 5)))
                .overallRating(Math.max(1, Math.min(5, request.getOverallRating() != null ? request.getOverallRating() : 5)))
                .comment(request.getComment())
                .isPublic(true)
                .createdAt(LocalDateTime.now())
                .build();

        review = reviewRepository.save(review);
        return mapToDto(review);
    }

    public List<ReviewDto.ReviewResponse> getPublicReviews() {
        return reviewRepository.findByIsPublicTrueOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Double getAverageOverallRating() {
        try {
            Object[] ratings = reviewRepository.getAverageRatings();
            if (ratings != null && ratings.length > 0 && ratings[0] != null) {
                return ((Number) ratings[0]).doubleValue();
            }
        } catch (Exception ignored) {}
        return 4.8;
    }

    private ReviewDto.ReviewResponse mapToDto(Review rev) {
        return ReviewDto.ReviewResponse.builder()
                .id(rev.getId())
                .orderCode(rev.getOrder() != null ? rev.getOrder().getOrderCode() : "")
                .customerName(rev.getCustomer() != null ? rev.getCustomer().getName() : "Guest")
                .foodRating(rev.getFoodRating())
                .serviceRating(rev.getServiceRating())
                .cleanlinessRating(rev.getCleanlinessRating())
                .overallRating(rev.getOverallRating())
                .comment(rev.getComment())
                .createdAt(rev.getCreatedAt())
                .build();
    }
}
