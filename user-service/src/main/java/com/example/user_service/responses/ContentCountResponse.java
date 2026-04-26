package com.example.user_service.responses;

public record ContentCountResponse(
        long postCount,
        long shortCount,
        boolean hasNewStory
) {
}
