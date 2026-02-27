package com.example.follow_service.clients;

import com.example.follow_service.responses.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "USER-SERVICE")
public interface UserClient {

    @GetMapping("/account/batch")
    List<UserResponse> getUsers(
            @RequestParam("ids") String ids,
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader("X-User-Roles") String roles,
            @RequestHeader("X-Session-Id") Long sessionId
    );

}