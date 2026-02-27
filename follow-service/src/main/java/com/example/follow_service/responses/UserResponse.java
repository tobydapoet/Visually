package com.example.follow_service.responses;

import com.example.follow_service.enums.StatusType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private UUID id;

    private String username;

    private String fullName;

    private String avatar;

//    private LocalDate dob;

//    private String phone;

//    private StatusType status;
//
//    private String bio;
//
//    private LocalDateTime createdAt;
//
//    private LocalDateTime updatedAt;

}

