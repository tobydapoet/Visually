package com.example.follow_service.controllers;

import com.example.follow_service.contexts.AuthContext;
import com.example.follow_service.entities.Follow;
import com.example.follow_service.enums.FollowType;
import com.example.follow_service.exceptions.UnauthorizedException;
import com.example.follow_service.requests.CurrentUser;
import com.example.follow_service.requests.FollowNotificationEvent;
import com.example.follow_service.responses.FollowInfoResponse;
import com.example.follow_service.responses.FollowResponse;
import com.example.follow_service.responses.UserResponse;
import com.example.follow_service.responses.UserSummaryStatusResponse;
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
            @RequestParam FollowType type) {
        CurrentUser currentUser = AuthContext.get();
        return followService.getCurrentFollowers(
                currentUser.getUserId(),
                page,
                size,
                type);
    }

    @GetMapping("/followers")
    public Page<FollowResponse> getFollowers(
            @RequestParam UUID followerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findAllByFollowerId(
                currentUser.getUserId(),
                followerId,
                page,
                size,
                search);
    }

    @GetMapping("/following/online")
    public Page<UserSummaryStatusResponse> getFollowers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findCurrentUserFollowing(
                currentUser.getUserId(),
                page,
                size);
    }

    @GetMapping("/following/status")
    public Page<FollowResponse> getUserIdsWithStatus(
            @RequestParam UUID followerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findAllByUserId(
                currentUser.getUserId(),
                followerId,
                page,
                size,
                search);
    }

    @GetMapping("/following")
    public Page<FollowResponse> getUserIds(
            @RequestParam UUID followerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findAllByUserId(
                currentUser.getUserId(),
                followerId,
                page,
                size,
                search);
    }

    @GetMapping("/both")
    public Page<FollowResponse> getBothByUserIds(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findBothByFollowerId(
                currentUser.getUserId(),
                page,
                size,
                search);
    }

    @GetMapping("/mutual")
    public Page<FollowResponse> getMutualFollowsUserIds(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        CurrentUser currentUser = AuthContext.get();
        return followService.findMutualFollows(
                currentUser.getUserId(),
                page,
                size,
                search);
    }

    @GetMapping("/{id}")
    public FollowInfoResponse isFollowed(
            @PathVariable UUID followedId) {
        CurrentUser currentUser = AuthContext.get();
        return followService.isFollowed(currentUser.getUserId(), followedId);
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, String>> follow(
            @PathVariable UUID id) {
        try {
            CurrentUser currentUser = AuthContext.get();

            if (currentUser.getRole().equals("CLIENT")) {
                throw new UnauthorizedException("Only clients can perform this action");
            }

            FollowNotificationEvent event = new FollowNotificationEvent();
            event.setFollowedId(id);
            event.setFollowerId(currentUser.getUserId());
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
            @PathVariable UUID id) {
        try {
            CurrentUser currentUser = AuthContext.get();
            boolean follow = followService.delete(id, currentUser.getUserId());
            if (currentUser.getRole().equals("CLIENT")) {
                throw new UnauthorizedException("Only clients can perform this action");
            }
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
