package com.example.service.controllers;

import com.example.service.responses.ApiResponse;
import com.example.service.services.AdMetricService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ad-metrics")
public class AdMetricController {

    @Autowired
    private AdMetricService adMetricService;

    @PostMapping("/{adId}/click")
    public ResponseEntity<ApiResponse<Void>> incrementClick(@PathVariable Long adId) {
        adMetricService.updateClick(adId);
        ApiResponse<Void> response = new ApiResponse<>();
        response.setMessage("Click recorded successfully");
        response.setData(null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{adId}/view")
    public ResponseEntity<ApiResponse<Void>> incrementView(@PathVariable Long adId) {
        adMetricService.updateView(adId);
        ApiResponse<Void> response = new ApiResponse<>();
        response.setMessage("View recorded successfully");
        response.setData(null);
        return ResponseEntity.ok(response);
    }
}
