package com.example.user_service.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FollowEvent {
    private UUID followerId;
    private UUID followedId;
    private String type;
}
