package com.example.service.controllers;

import com.example.service.contexts.AuthContext;
import com.example.service.entities.Ad;
import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.requests.CreateAdDto;
import com.example.service.requests.CurrentUser;
import com.example.service.responses.AdFeedResponse;
import com.example.service.responses.AdResponse;
import com.example.service.responses.ApiResponse;
import com.example.service.services.AdService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/ads")
public class AdController {

    @Autowired
    private AdService adService;

    @PostMapping()
    public ResponseEntity<ApiResponse<Ad>> createAd(
            @ModelAttribute CreateAdDto createAdDto) {
        Ad ad = adService.createAd(createAdDto);
        ApiResponse<Ad> response = new ApiResponse<>();
        response.setMessage("Ad created successfully");
        response.setData(ad);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping("/my-ads")
    public Page<AdResponse> getMyAds(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        CurrentUser currentUser = AuthContext.get();
        Page<AdResponse> res = adService.findByUserIdWithContent(currentUser.getUserId(), page, size);
        return res;
    }

    @GetMapping("/user/{userId}")
    public Page<AdResponse> getAdsByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<AdResponse> res = adService.findByUserIdWithContent(userId, page, size);
        return res;
    }

    @GetMapping("/feed")
    public List<AdFeedResponse> getAdsForFeed(
            @RequestParam(defaultValue = "30") int size,
            @RequestParam() AdType type
    ) {

        CurrentUser currentUser = AuthContext.get();

        List<Ad> ads = adService.getAdsForFeed(currentUser.getUserId(), size, type);

        return ads.stream().map(ad -> new AdFeedResponse(
                ad.getContentId(),
                ad.getType()
        )).toList();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Ad>>> getAllAds(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Ad> ads = adService.FindByPage(page, size);
        ApiResponse<Page<Ad>> response = new ApiResponse<>();
        response.setMessage("Ads retrieved successfully");
        response.setData(ads);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public AdResponse getAdById(@PathVariable Long id) {
        CurrentUser currentUser = AuthContext.get();
        AdResponse res = adService.findContentById(id, currentUser.getUserId());
        return res;
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateAdStatus(
            @PathVariable Long id,
            @RequestParam AdStatus status) {
        adService.updateStatus(id, status);
        ApiResponse<Void> response = new ApiResponse<>();
        response.setMessage("Ad status updated successfully");
        response.setData(null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public Page<AdResponse> searchAds(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        CurrentUser currentUser = AuthContext.get();
        Page<AdResponse> res = adService.search(keyword, page, size, currentUser.getUserId());
        return res;
    }
}
