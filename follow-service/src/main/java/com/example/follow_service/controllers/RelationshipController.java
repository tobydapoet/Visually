package com.example.follow_service.controllers;

import com.example.follow_service.contexts.AuthContext;
import com.example.follow_service.requests.CurrentUser;
import com.example.follow_service.responses.BlockInfoResponse;
import com.example.follow_service.responses.FollowInfoResponse;
import com.example.follow_service.responses.RelationshipResponse;
import com.example.follow_service.services.BlockService;
import com.example.follow_service.services.FollowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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
            @PathVariable UUID followedId,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        UUID currentUserId = null;

        if (userId != null && !userId.isBlank()) {
            currentUserId = UUID.fromString(userId);
        }

        FollowInfoResponse followInfoResponse =
                followService.isFollowed(followedId, currentUserId);

        boolean isBlock = false;
        if (currentUserId != null) {
            BlockInfoResponse blockInfoResponse =
                    blockService.isBlocked(followedId, currentUserId);
            isBlock = blockInfoResponse.isBlock();
        }

        return new RelationshipResponse(
                isBlock,
                followInfoResponse.isFollow()
        );
    }

}