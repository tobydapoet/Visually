package com.example.media_service.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class MusicCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Artist is required")
    private String artist;

    @NotNull(message = "Url file is required")
    MultipartFile url;

    @NotNull(message = "Image is required")
    MultipartFile img;
}
