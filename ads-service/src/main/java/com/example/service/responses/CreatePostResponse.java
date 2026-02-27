package com.example.service.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostResponse {

    private Long id;

    private UUID userId;

    private String username;

    private String avatarUrl;

    private String caption;

    private Integer musicId;

    private List<String> medias;

    private Integer likeCount;

    private Integer commentCount;

    private Integer shareCount;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

