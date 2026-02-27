package com.example.user_service.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SessionRequest {
    @NotNull
    private Long id;

    @NotBlank
    private UUID userId;

    @NotBlank
    private String token;

    @NotNull
    private LocalDateTime expiredAt;
}
