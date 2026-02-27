package com.example.follow_service.services;

import com.example.follow_service.entities.Block;
import com.example.follow_service.entities.Follow;
import com.example.follow_service.exceptions.ConflictException;
import com.example.follow_service.repositories.BlockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class BlockService {
    @Autowired
    BlockRepository blockRepository;

    public Block save (UUID userId, UUID blockerId) {
        Block block = new Block();
        block.setBlockerId(blockerId);
        block.setUserId(userId);
        blockRepository.save(block);
        return block;
    }

    public boolean delete(UUID userId, UUID blockerId) {
        Block block = blockRepository.findByUserIdAndBlockerId(userId, blockerId).orElseThrow(()->new ConflictException("Block not found"));
        blockRepository.deleteById(block.getId());
        return true;
    }

    public Map<String, String> isBlocked(UUID userId, UUID blockerId) {
        Optional<Block> followOpt =
                blockRepository.findByUserIdAndBlockerId(userId, blockerId);

        Map<String, String> map = new HashMap<>();
        map.put("isBlock", followOpt.isPresent() ? "true" : "false");

        return map;
    }

    public boolean isBlockedBool(UUID userId, UUID targetUserId) {
        return blockRepository
                .findByUserIdAndBlockerId(userId, targetUserId)
                .isPresent()
                || blockRepository
                .findByUserIdAndBlockerId(targetUserId, userId)
                .isPresent();
    }
}
