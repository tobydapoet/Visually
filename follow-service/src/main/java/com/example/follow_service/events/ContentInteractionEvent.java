package com.example.follow_service.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContentInteractionEvent {
    private String senderId;
    private Long contentId;
    private String contentType;
    private Long likeCount;
    private Long saveCount;
    private Long commentCount;
    private String timestamp;
}
