package com.example.user_service.requests;

import com.example.user_service.entities.User;
import com.example.user_service.enums.StatusType;
import com.example.user_service.responses.UserSummaryResponse;
import lombok.Getter;

import java.util.UUID;

@Getter
public class UserStatusSummaryResponse extends UserSummaryResponse {
    private StatusType status;

    public UserStatusSummaryResponse(
            UUID id,
            String username,
            String fullName,
            String avatarUrl,
            StatusType status
    ) {
        super(id, username, fullName, avatarUrl);
        this.status = status;
    }

    public static UserStatusSummaryResponse fromEntity(User user) {
        return new UserStatusSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getStatus()
        );
    }
}