package com.example.user_service.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.Map;
import java.util.UUID;

@FeignClient(name = "FOLLOW-SERVICE")
public interface FollowClient {
    @GetMapping(value = "/follow/{id}")
    Map<String, String> isFollowed(
            @PathVariable UUID followedId,
            @RequestHeader("X-User-Id") String userId
    );

    @GetMapping(value = "/block/{id}")
    Map<String, String> isBlocked(
            @PathVariable UUID blockedId,
            @RequestHeader("X-User-Id") String userId
    );
}
