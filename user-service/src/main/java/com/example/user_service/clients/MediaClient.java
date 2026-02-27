package com.example.user_service.clients;

import com.example.user_service.responses.MediaResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@FeignClient(
        name = "MEDIA-SERVICE"
)
public interface MediaClient {
    @PostMapping(
            value = "/media_file",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    List<MediaResponse> upload(
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam("folder") String folder,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Roles") String roles
    );

    @DeleteMapping("/media_file")
    void delete(
            @RequestBody List<Long> urlIds,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Roles") String roles
    );
}
