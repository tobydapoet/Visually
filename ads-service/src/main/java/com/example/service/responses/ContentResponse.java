package com.example.service.responses;

import lombok.AllArgsConstructor;
import lombok.Data;

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

    private Boolean isLiked;
    private Boolean isCommented;
    private Boolean isSaved;
    private Boolean isReposted;
}