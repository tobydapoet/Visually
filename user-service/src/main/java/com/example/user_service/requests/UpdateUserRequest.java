package com.example.user_service.requests;

import com.example.user_service.enums.Gender;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {
    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "Date of birth is required")
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dob;

    private String fullName;

    private String username;

    private String bio;

    private MultipartFile file;

    private Gender gender;
}
