package com.example.user_service.responses;

import com.example.user_service.entities.User;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserResponseExtend extends UserResponse {
    private Boolean isFollowed;
    private Boolean isBlocked;

    public UserResponseExtend(User user, Boolean isFollowed, Boolean isBlocked) {
        super(
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
        this.isFollowed = isFollowed;
        this.isBlocked = isBlocked;
    }

    public static UserResponseExtend from(User user, Boolean isFollowed, Boolean isBlocked) {
        return new UserResponseExtend(user, isFollowed, isBlocked);
    }
}