package com.example.follow_service.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentCreatedEvent {
    private String senderId;
    private String username;
    private String avatarUrl;
    private Long contentId;
    private String contentType;
    private String createdAt;
}
