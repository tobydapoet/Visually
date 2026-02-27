package com.example.user_service.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleRequest {
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Full name cannot be empty")
    private String fullName;

    @NotBlank(message = "Provider is required")
    private String providerId;

    private String avatarUrl;
}
