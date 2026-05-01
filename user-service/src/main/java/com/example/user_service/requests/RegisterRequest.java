package com.example.user_service.requests;

import com.example.user_service.enums.Gender;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$",
            message = "Password must be at least 8 characters and include letters and numbers"
    )
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dob;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotBlank(message = "Full name cannot be empty")
    private String fullName;

    @NotBlank(message = "username cannot be empty")
    private String username;

    @Pattern(
            regexp = "^(0|\\+84|84)(3|5|7|8|9)[0-9]{8}$",
            message = "Invalid Phone number"
    )
    @NotNull(message = "Phone is required")
    private String phone;
}
