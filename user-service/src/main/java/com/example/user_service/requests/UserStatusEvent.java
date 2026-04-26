package com.example.user_service.requests;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserStatusEvent {
    private UUID userId;
    private LocalDateTime lastSeen;
}
