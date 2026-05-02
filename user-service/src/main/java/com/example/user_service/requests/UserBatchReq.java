package com.example.user_service.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserBatchReq {

    @NotNull(message = "Id is required")
    UUID id;

    @NotBlank(message = "Username is required")
    String username;
}
