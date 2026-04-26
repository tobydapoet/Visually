package com.example.service.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ContentResponse {
    private Long id;
    private String caption;

    private String userId;
    private String username;
    private String avatarUrl;

    private Integer likeCount;
    private Integer commentCount;
    private Integer saveCount;
    private Integer repostCount;

    private String thumbnailUrl;

    private List<MentionItem> mentions;
}

