package com.example.service.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShortResponse {
    private Long id;

    private UUID userId;

    private String username;

    private String avatarUrl;

    private String caption;

    private Integer thumbnailId;

    private String thumbnailUrl;

    private Integer mediaId;

    private String mediaUrl;

    private Integer musicId;

    private String musicUrl;

    private Integer likeCount;

    private Integer commentCount;

    private Integer shareCount;
}