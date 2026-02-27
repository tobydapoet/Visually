package com.example.user_service.requests;

import com.example.user_service.enums.Gender;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {
    private LocalDate dob;

    private String fullName;

    @Pattern(
            regexp = "^(0|\\+84|84)(3|5|7|8|9)[0-9]{8}$",
            message = "Invalid Phone number"
    )
    private String phone;

    private String bio;

    private MultipartFile file;

    private Gender gender;
}
