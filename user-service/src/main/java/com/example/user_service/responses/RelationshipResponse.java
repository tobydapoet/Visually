package com.example.user_service.responses;

public record RelationshipResponse(
        boolean isBlock,
        boolean isFollow,
        long followersCount,
        long followingCount
) {}

