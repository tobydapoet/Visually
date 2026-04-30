package com.example.follow_service.responses;

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
}


