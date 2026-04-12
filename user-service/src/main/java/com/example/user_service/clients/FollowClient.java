package com.example.user_service.clients;

import com.example.user_service.responses.RelationshipResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "FOLLOW-SERVICE")
public interface FollowClient {
    @GetMapping(value = "/relationship/{followedId}")
    RelationshipResponse getRelationShip(
            @PathVariable UUID followedId,
            @RequestHeader("X-User-Id") String userId
    );
}
