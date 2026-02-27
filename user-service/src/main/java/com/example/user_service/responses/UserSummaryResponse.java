package com.example.user_service.responses;

import com.example.user_service.entities.User;
import com.example.user_service.enums.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryResponse {
    private UUID id;

    private String username;

    private String fullName;

    private String avatar;

    public static UserSummaryResponse fromEntity(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getAvatarUrl()
        );
    }
}

