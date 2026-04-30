package com.example.user_service.responses;

import com.example.user_service.entities.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryStatusResponse {
    private UUID id;

    private String username;

    private String fullName;

    private String avatar;

    private LocalDateTime lastSeen;

    public static UserSummaryStatusResponse fromEntity(User user) {
        return new UserSummaryStatusResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getLastSeen()
        );
    }
}


