package com.lowkeycafe.restaurant.controller;

import com.lowkeycafe.restaurant.dto.ReviewDto;
import com.lowkeycafe.restaurant.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDto.ReviewResponse> submitReview(@RequestBody ReviewDto.CreateReviewRequest request) {
        return ResponseEntity.ok(reviewService.submitReview(request));
    }

    @GetMapping
    public ResponseEntity<List<ReviewDto.ReviewResponse>> getPublicReviews() {
        return ResponseEntity.ok(reviewService.getPublicReviews());
    }
}
