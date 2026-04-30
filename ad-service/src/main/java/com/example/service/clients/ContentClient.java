package com.example.service.clients;

import com.example.service.enums.AdType;
import com.example.service.responses.ApiResponse;
import com.example.service.responses.ContentResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "CONTENT-SERVICE")
public interface ContentClient {
    @GetMapping(value = "/content/target")
    ContentResponse getContent(
            @RequestParam("contentId") Long contentId,
            @RequestParam("contentType") AdType contentType,
            @RequestHeader("x-user-id") UUID userId
    );

    @GetMapping("/post/batch")
    List<ContentResponse> getPostsByIds(@RequestParam List<Long> ids);

    @GetMapping("/short/batch")
    List<ContentResponse> getShortsByIds(@RequestParam List<Long> ids);
}
