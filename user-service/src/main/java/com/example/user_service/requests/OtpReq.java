package com.example.user_service.requests;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpReq {
    @NotBlank
    @Email
    String email;

    @NotBlank
    @Size(min = 6, max = 6)
    String otp;
}
