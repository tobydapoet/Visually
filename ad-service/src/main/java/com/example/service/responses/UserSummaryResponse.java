package com.example.service.responses;

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
    private String avatar;
    private String fullName;
}
