package com.example.media_service.requests;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class MusicUpdateRequest {
    private String title;

    private String artist;

    MultipartFile url;

    MultipartFile img;
}
