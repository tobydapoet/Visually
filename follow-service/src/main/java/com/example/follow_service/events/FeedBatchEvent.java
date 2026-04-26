package com.example.follow_service.events;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Builder
@Data
public class FeedBatchEvent {
    private List<String> followerIds;
    private Long contentId;
    private String contentType;
    private Long likeCount;
    private Long saveCount;
    private Long commentCount;
    private String timestamp;
}
