package com.example.follow_service.services;

import com.example.follow_service.entities.Block;
import com.example.follow_service.exceptions.ConflictException;
import com.example.follow_service.repositories.BlockRepository;
import com.example.follow_service.responses.BlockInfoResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class BlockService {
    @Autowired
    BlockRepository blockRepository;

    public Block save(UUID userId, UUID blockerId) {
        Block block = new Block();
        block.setBlockerId(blockerId);
        block.setUserId(userId);
        blockRepository.save(block);
        return block;
    }

    public boolean delete(UUID userId, UUID blockerId) {
        Block block = blockRepository.findByUserIdAndBlockerId(userId, blockerId)
                .orElseThrow(() -> new ConflictException("Block not found"));
        blockRepository.deleteById(block.getId());
        return true;
    }

    public BlockInfoResponse isBlocked(UUID userId, UUID blockerId) {
        if (userId == null || blockerId == null) {
            return new BlockInfoResponse(false);
        }

        boolean way1 = blockRepository.findByUserIdAndBlockerId(userId, blockerId).isPresent();
        boolean way2 = blockRepository.findByUserIdAndBlockerId(blockerId, userId).isPresent();

        log.info("isBlocked => userId={}, blockerId={}, way1={}, way2={}", userId, blockerId, way1, way2);

        boolean isBlock = way1 || way2;

        return new BlockInfoResponse(isBlock);
    }

    public boolean isBlockedBool(UUID userId, UUID targetUserId) {
        return blockRepository
                .findByUserIdAndBlockerId(userId, targetUserId)
                .isPresent()
                || blockRepository
                        .findByUserIdAndBlockerId(targetUserId, userId)
                        .isPresent();
    }

    public List<UUID> getCurrentBlockers(UUID userId) {
        return blockRepository.findCurrentBlockerIds(userId);
    }

    public Map<UUID, Boolean> getBlockedUsers(
            UUID currentUserId,
            List<UUID> targetUserIds) {
        if (targetUserIds == null || targetUserIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<UUID> blockedIds = blockRepository.findBlockedIds(currentUserId, targetUserIds);

        Set<UUID> blockedSet = new HashSet<>(blockedIds);

        Map<UUID, Boolean> result = new HashMap<>();

        for (UUID targetId : targetUserIds) {
            result.put(targetId, blockedSet.contains(targetId));
        }

        return result;
    }

    public Map<String, Boolean> getBlockedUser(
            UUID currentUserId,
            UUID targetUserId) {
        boolean isBlocked = blockRepository.existsBlock(currentUserId, targetUserId);
        return Map.of("isBlocked", isBlocked);
    }
}
