package com.example.user_service.clients;

import com.example.user_service.responses.RelationshipResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@FeignClient(name = "FOLLOW-SERVICE")
public interface FollowClient {
    @GetMapping(value = "/relationship/{followedId}")
    RelationshipResponse getRelationShip(
            @PathVariable UUID followedId,
            @RequestHeader("X-User-Id") String userId
    );

    @PostMapping(value = "/block/users/check-block")
    public Map<UUID, Boolean> checkBlockedUsers(
            @RequestBody List<UUID> targetUserIds,
            @RequestHeader("X-User-Id") String userId
    );
}
