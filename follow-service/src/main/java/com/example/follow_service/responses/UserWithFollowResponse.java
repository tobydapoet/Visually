package com.example.follow_service.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.BeanUtils;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWithFollowResponse extends UserResponse {
    private Boolean isFollowed;

    public static UserWithFollowResponse from(UserResponse user, Boolean isFollowed) {
        UserWithFollowResponse response = new UserWithFollowResponse();
        BeanUtils.copyProperties(user, response);
        response.setIsFollowed(isFollowed);
        return response;
    }
}