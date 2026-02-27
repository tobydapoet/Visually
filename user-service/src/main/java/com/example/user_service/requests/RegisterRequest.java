package com.example.user_service.requests;

import com.example.user_service.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterRequest {
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
//    @Pattern(
//            regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$",
//            message = "Password must be at least 8 characters and include letters and numbers"
//    )
    private String password;

    @NotBlank(message = "Password is required")
    private String confirmPassword;

    @NotNull(message = "Date of birth is required")
    private LocalDate dob;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotBlank(message = "Full name cannot be empty")
    private String fullName;

    @Pattern(
            regexp = "^(0|\\+84|84)(3|5|7|8|9)[0-9]{8}$",
            message = "Invalid Phone number"
    )
    @NotNull(message = "Phone is required")
    private String phone;
}
