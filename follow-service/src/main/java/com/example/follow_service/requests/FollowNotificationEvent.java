package com.example.follow_service.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FollowNotificationEvent {
    private UUID followerId;
    private UUID followedId;
    private String followerUsername;
    private String followerAvatarUrl;
}
