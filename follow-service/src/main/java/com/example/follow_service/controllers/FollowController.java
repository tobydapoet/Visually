package com.example.follow_service.controllers;

import com.example.follow_service.contexts.AuthContext;
import com.example.follow_service.entities.Follow;
import com.example.follow_service.enums.FollowType;
import com.example.follow_service.requests.CurrentUser;
import com.example.follow_service.requests.FollowEvent;
import com.example.follow_service.requests.FollowNotificationEvent;
import com.example.follow_service.responses.FollowResponse;
import com.example.follow_service.responses.UserResponse;
import com.example.follow_service.services.FollowService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("follow")
public class FollowController {
    @Autowired
    private FollowService followService;

    @GetMapping("/current")
    public Page<UserResponse> getFollowersOrFollowings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam FollowType type
    ) {
        CurrentUser currentUser = AuthContext.get();
        return followService.getCurrentFollowers(
                currentUser.getUserId(),
                page,
                size,
                type,
                String.join(",", currentUser.getRoles()),
                currentUser.getSessionId()
        );
    }

    @GetMapping("/check-follow-no-block")
    public ResponseEntity<Map<String, Boolean>> checkFollowNoBlock(
            @RequestParam UUID userId,
            @RequestParam UUID targetUserId) {

        Map<String, Boolean> result = followService.isFollowedNoBlock(userId, targetUserId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/followers")
    public Page<FollowResponse> getFollowers(
            @RequestParam UUID followerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        System.out.println("followerId = " + followerId);
        CurrentUser currentUser = AuthContext.get();
        return followService.findAllByFollowerId(
                currentUser.getUserId(),
                followerId,
                page,
                size,
                String.join(",", currentUser.getRoles()),
                currentUser.getSessionId());
    }

    @GetMapping("/following")
    public Page<FollowResponse> getUserIds(
            @RequestParam UUID followerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findAllByUserId(
                currentUser.getUserId(),
                followerId,
                page,
                size,
                String.join(",", currentUser.getRoles()),
                currentUser.getSessionId());
    }

    @GetMapping("/{id}")
    Map<String, String> isFollowed(
            @PathVariable UUID followedId
    ) {
        CurrentUser currentUser = AuthContext.get();
        return followService.isFollowed(currentUser.getUserId(), followedId);
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, String>> follow(
            @PathVariable UUID id
    ) {
        try {
            CurrentUser currentUser = AuthContext.get();

            FollowNotificationEvent event = new FollowNotificationEvent();
            event.setFollowedId(currentUser.getUserId());
            event.setFollowerId(id);
            event.setFollowerAvatarUrl(currentUser.getAvatarUrl());
            event.setFollowerUsername(currentUser.getUsername());

            Follow follow = followService.save(event);

            Map<String, String> response = new HashMap<>();
            if (follow != null) {
                response.put("status", "success");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> unfollow(
            @PathVariable UUID id
    ) {
        try {
            CurrentUser currentUser = AuthContext.get();
            boolean follow = followService.delete(currentUser.getUserId(), id);
            Map<String, String> response = new HashMap<>();
            if (follow) {
                response.put("status", "success");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
