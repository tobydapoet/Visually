package com.example.service.clients;

import com.example.service.requests.CreatePostDto;
import com.example.service.requests.CreateShortDto;
import com.example.service.responses.ApiResponse;
import com.example.service.responses.CreatePostResponse;
import com.example.service.responses.CreateShortResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "CONTENT-SERVICE")
public interface ContentClient {
    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<CreatePostResponse> createPost(
            @RequestPart("createPostDto") CreatePostDto dto,
            @RequestPart("files") List<MultipartFile> files,
            @RequestHeader("X-User-Id") UUID userId
    );

    @PostMapping(value = "/shorts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<CreateShortResponse> createShort(
            @RequestPart("createShortDto") CreateShortDto dto,
            @RequestPart("file") MultipartFile file,
            @RequestHeader("X-User-Id") UUID userId
    );

}
