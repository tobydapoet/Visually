package com.example.service.controllers;

import com.example.service.contexts.AuthContext;
import com.example.service.entities.Ad;
import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.requests.CreatePostAdDto;
import com.example.service.requests.CreateShortAdDto;
import com.example.service.requests.CurrentUser;
import com.example.service.responses.AdFeedResponse;
import com.example.service.responses.ApiResponse;
import com.example.service.services.AdService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.apache.tomcat.util.descriptor.web.ContextService;
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

    @PostMapping(value = "/post", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Ad>> createPostAd(
            @ModelAttribute CreatePostAdDto createPostAdDto) {
        Ad ad = adService.saveAdPost(createPostAdDto);
        ApiResponse<Ad> response = new ApiResponse<>();
        response.setMessage("Post ad created successfully");
        response.setData(ad);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/short", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Ad>> createShortAd(
            @ModelAttribute CreateShortAdDto createShortAdDto) {
        Ad ad = adService.saveAdShort(createShortAdDto);
        ApiResponse<Ad> response = new ApiResponse<>();
        response.setMessage("Short ad created successfully");
        response.setData(ad);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-ads")
    public ResponseEntity<ApiResponse<Page<Ad>>> getMyAds(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        CurrentUser currentUser = AuthContext.get();
        Page<Ad> ads = adService.FindByUserId(currentUser.getUserId(), page, size);
        ApiResponse<Page<Ad>> response = new ApiResponse<>();
        response.setMessage("Ads retrieved successfully");
        response.setData(ads);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<Ad>>> getAdsByUserId(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Ad> ads = adService.FindByUserId(userId, page, size);
        ApiResponse<Page<Ad>> response = new ApiResponse<>();
        response.setMessage("Ads retrieved successfully");
        response.setData(ads);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feed")
    public List<AdFeedResponse> getAdsForFeed(
            @RequestParam(defaultValue = "30") int size,
            @RequestParam() AdType type
    ) {

        CurrentUser currentUser = AuthContext.get();

        List<Ad> ads = adService.getAdsForFeed(currentUser.getUserId(), size, type);

        return ads.stream().map(ad -> new AdFeedResponse(
                ad.getAdContentId(),
                ad.getAdType()
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
    public ResponseEntity<ApiResponse<Ad>> getAdById(@PathVariable Long id) {
        Ad ad = adService.findById(id);
        ApiResponse<Ad> response = new ApiResponse<>();
        response.setMessage("Ad retrieved successfully");
        response.setData(ad);
        return ResponseEntity.ok(response);
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
    public ResponseEntity<ApiResponse<Page<Ad>>> searchAds(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        Page<Ad> ads = adService.search(keyword, page, size);
        ApiResponse<Page<Ad>> response = new ApiResponse<>();
        response.setMessage("Search results retrieved successfully");
        response.setData(ads);
        return ResponseEntity.ok(response);
    }
}
