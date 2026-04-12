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

    private String username;

    private String bio;

    private MultipartFile file;

    private Gender gender;
}
