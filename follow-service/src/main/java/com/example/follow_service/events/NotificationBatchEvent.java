package com.example.follow_service.events;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class NotificationBatchEvent {
    private List<String> followerIds;
    private String senderId;
    private String username;
    private String avatarUrl;
    private Long contentId;
    private String contentType;
    private String createdAt;
}
