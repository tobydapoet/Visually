package com.example.service.controllers;

import com.example.service.contexts.AuthContext;
import com.example.service.entities.Ad;
import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.Gender;
import com.example.service.exceptions.UnauthorizedException;
import com.example.service.requests.CreateAdDto;
import com.example.service.requests.CurrentUser;
import com.example.service.requests.PendingAdData;
import com.example.service.responses.AdFeedResponse;
import com.example.service.responses.AdResponse;
import com.example.service.responses.ApiResponse;
import com.example.service.responses.UserSummaryResponse;
import com.example.service.services.AdService;
import com.example.service.services.PendingAdService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/ad")
public class AdController {
    @Autowired
    private AdService adService;

    @Autowired
    private PendingAdService pendingAdService;

    @PostMapping()
    public ResponseEntity<ApiResponse<Ad>> createAd(
            @RequestBody CreateAdDto createAdDto) {
        CurrentUser currentUser = AuthContext.get();
        if (currentUser.getRole().equals("CLIENT")) {
            throw new UnauthorizedException("Only clients can perform this action");
        }
        PendingAdData data = new PendingAdData();
        data.setDto(createAdDto);
        data.setUsername(currentUser.getUsername());
        Ad ad = adService.createAd(data, currentUser.getUserId());
        ApiResponse<Ad> response = new ApiResponse<>();
        response.setMessage("Ad created successfully");
        response.setData(ad);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/pending")
    public ResponseEntity<?> savePendingAd(@RequestBody CreateAdDto dto) {
        CurrentUser currentUser = AuthContext.get();
        if (currentUser.getRole().equals("CLIENT")) {
            throw new UnauthorizedException("Only clients can perform this action");
        }
        pendingAdService.save(currentUser.getUserId(), currentUser.getUsername(), dto);
        return ResponseEntity.ok(Map.of("message", "OK"));
    }

    @GetMapping("/my-ads")
    public Page<AdResponse> getMyAds(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        CurrentUser currentUser = AuthContext.get();
        Page<AdResponse> res = adService.findByUserIdWithContent(currentUser.getUserId(), page, size);
        return res;
    }

    @GetMapping("/users")
    public Page<UserSummaryResponse> getUsers(
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {

        CurrentUser currentUser = AuthContext.get();
        return adService.getUsers(currentUser.getUserId(), username, page, size);
    }

    @GetMapping("/user/{userId}")
    public Page<AdResponse> getAdsByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        return adService.findByUserIdWithContent(userId, page, size);
    }

    @GetMapping("/feed")
    public List<AdFeedResponse> getAdsForFeed(
            @RequestParam(required = false) Integer age,
            @RequestParam(required = false) Gender gender) {
        List<Ad> ads = adService.getAdByGenderAndAge(gender, age);

        return new ArrayList<>(ads.stream().map(ad -> new AdFeedResponse(
                ad.getContentId(),
                ad.getContentType())).toList());
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

    @PutMapping("/{id}/status")
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
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        CurrentUser currentUser = AuthContext.get();
        Page<AdResponse> res = adService.search(keyword, page, size, currentUser.getUserId());
        return res;
    }
}
