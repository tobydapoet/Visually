package com.example.follow_service.responses;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

public record FollowResponse(
        UUID followedId,
        UserWithFollowResponse user,
        LocalDateTime createdAt
) {}