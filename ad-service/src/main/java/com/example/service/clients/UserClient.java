package com.example.service.clients;

import com.example.service.enums.AdType;
import com.example.service.responses.ContentResponse;
import com.example.service.responses.UserSummaryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "USER-SERVICE")
public interface UserClient {
    @GetMapping("/account/batch")
    List<UserSummaryResponse> getUsers(
            @RequestParam("ids") String ids,
            @RequestHeader("X-User-Id") UUID userId
    );
}