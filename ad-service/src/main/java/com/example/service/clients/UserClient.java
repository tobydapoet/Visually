package com.example.service.clients;

import com.example.service.responses.UserSummaryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "CONTENT-SERVICE")
public interface UserClient {
    @GetMapping(value = "/summary/{id}")
    UserSummaryResponse getUser(
            @PathVariable UUID id
    );
}
