package com.example.media_service.requests;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class CurrentUser {
    private UUID userId;
    private Long sessionId;
    private String role;
}
