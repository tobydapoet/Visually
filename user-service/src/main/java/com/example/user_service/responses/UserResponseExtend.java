package com.example.user_service.responses;

import com.example.user_service.entities.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseExtend extends UserResponse {
    private Boolean isFollowed;
    private Boolean isBlocked;
    private long followersCount;
    private long followingCount;
    private long postCount;
    private long shortCount;
    private Boolean hasNewStory;

    public UserResponseExtend(User user, Boolean isFollowed, Boolean isBlocked, long followersCount, long followingCount, long postCount, long shortCount, Boolean hasNewStory) {
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
                user.getGender(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                user.getRole()
        );
        this.isFollowed = isFollowed;
        this.isBlocked = isBlocked;
        this.followersCount = followersCount;
        this.followingCount = followingCount;
        this.postCount = postCount;
        this.shortCount = shortCount;
        this.hasNewStory = hasNewStory;
    }

    public static UserResponseExtend from(User user, Boolean isFollowed, Boolean isBlocked, long followersCount, long followingCount, long postCount, long shortCount, Boolean hasNewStory) {
        return new UserResponseExtend(user, isFollowed, isBlocked, followersCount, followingCount, postCount, shortCount,  hasNewStory);
    }
}