package com.example.user_service.responses;

import com.example.user_service.entities.User;
import com.example.user_service.enums.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private UUID id;

    private String email;

    private String username;

    private String fullName;

    private String avatar;

    private LocalDate dob;

    private String phone;

    private StatusType status;

    private String bio;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getDob(),
                user.getPhone(),
                user.getStatus(),
                user.getBio(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}

