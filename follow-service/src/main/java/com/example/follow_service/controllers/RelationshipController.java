package com.example.follow_service.controllers;

import com.example.follow_service.contexts.AuthContext;
import com.example.follow_service.requests.CurrentUser;
import com.example.follow_service.responses.BlockInfoResponse;
import com.example.follow_service.responses.FollowInfoResponse;
import com.example.follow_service.responses.RelationshipResponse;
import com.example.follow_service.services.BlockService;
import com.example.follow_service.services.FollowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/relationship")
public class RelationshipController {

    @Autowired
    FollowService followService;

    @Autowired
    BlockService blockService;

    @GetMapping("/{followedId}")
    public RelationshipResponse getRelationship(
            @PathVariable UUID followedId
    ) {

        CurrentUser currentUser = AuthContext.get();

        UUID currentUserId = currentUser != null ? currentUser.getUserId() : null;

        FollowInfoResponse followInfoResponse =
                followService.isFollowed(followedId, currentUserId);

        BlockInfoResponse blockInfoResponse =
                blockService.isBlocked(followedId, currentUserId);

        return new RelationshipResponse(
                blockInfoResponse.isBlock(),
                followInfoResponse.isFollow(),
                followInfoResponse.followersCount(),
                followInfoResponse.followingCount()
        );
    }

}