package com.example.follow_service.controllers;

import com.example.follow_service.contexts.AuthContext;
import com.example.follow_service.entities.Block;
import com.example.follow_service.requests.CurrentUser;
import com.example.follow_service.responses.BlockInfoResponse;
import com.example.follow_service.services.BlockService;
import com.example.follow_service.services.FollowService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("block")
public class BlockController {
    @Autowired
    private BlockService blockService;

    @Autowired
    private FollowService followService;

    @PostMapping("/users/check-block")
    public Map<UUID, Boolean> checkBlockedUsers(
            @RequestBody List<UUID> targetUserIds
    ) {
        CurrentUser currentUser = AuthContext.get();

        return blockService.getBlockedUsers(
                currentUser.getUserId(),
                targetUserIds
        );
    }

    @GetMapping("/current")
    public List<UUID> getCurrentBlockers(
            @PathVariable UUID userId
    ) {
        CurrentUser currentUser = AuthContext.get();
        return blockService.getCurrentBlockers(
                currentUser.getUserId()
        );
    }

    @GetMapping("/user/check-block/{userId}")
    public Map<String, Boolean> checkBlockedUser(
            @PathVariable UUID userId
    ) {
        CurrentUser currentUser = AuthContext.get();

        return blockService.getBlockedUser(
                currentUser.getUserId(),
                userId
        );
    }

    @GetMapping("/{id}")
    public BlockInfoResponse isBlocked(
            @PathVariable UUID blockedId
    ) {
        CurrentUser currentUser = AuthContext.get();
        return blockService.isBlocked(currentUser.getUserId(), blockedId);
    }

    @PostMapping("/{id}")
    public ResponseEntity<Map<String, String>> block(
            @PathVariable UUID id
    ) {
        try {
            CurrentUser currentUser = AuthContext.get();
            Block block = followService.blockUser(currentUser.getUserId(), id);

            Map<String, String> response = new HashMap<>();
            if (block != null) {
                response.put("status", "success");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> unblock(
            @PathVariable UUID id
    ) {
        try {
            CurrentUser currentUser = AuthContext.get();
            boolean block = blockService.delete(currentUser.getUserId(), id);
            Map<String, String> response = new HashMap<>();
            if (block) {
                response.put("status", "success");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
