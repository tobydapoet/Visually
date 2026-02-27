package com.example.follow_service.repositories;

import com.example.follow_service.entities.Block;
import com.example.follow_service.entities.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BlockRepository extends JpaRepository<Block,Long> {
    Optional<Block> findByUserIdAndBlockerId(UUID userId, UUID blockerId);

}
