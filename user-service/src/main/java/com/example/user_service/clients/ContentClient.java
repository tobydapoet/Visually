package com.example.user_service.clients;

import com.example.user_service.responses.ContentCountResponse;
import com.example.user_service.responses.RelationshipResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.UUID;

@FeignClient(name = "CONTENT-SERVICE")
public interface ContentClient {
    @GetMapping(value = "/content/{userId}")
    ContentCountResponse getContentCount(
            @PathVariable UUID userId
    );
}