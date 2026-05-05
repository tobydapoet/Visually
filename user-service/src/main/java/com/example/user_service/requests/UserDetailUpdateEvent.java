package com.example.user_service.requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDetailUpdateEvent {
    private UUID id;
    private String avatarUrl;
    private String username;
}
