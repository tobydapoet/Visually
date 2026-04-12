package com.example.follow_service.responses;

public record FollowInfoResponse(
        boolean isFollow,
        long followersCount,
        long followingCount
) {}
