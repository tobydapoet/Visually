package com.example.user_service.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordReq {
    @NotBlank
    private String resetToken;

    @NotBlank
//    @Pattern(
//            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$",
//            message = "Password must be at least 8 characters and include letters and numbers"
//    )
    private String password;

    @NotBlank
    private String confirmPassword;
}
