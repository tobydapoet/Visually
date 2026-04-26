package com.example.follow_service.repositories;

import com.example.follow_service.entities.Block;
import com.example.follow_service.entities.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlockRepository extends JpaRepository<Block,Long> {
    Optional<Block> findByUserIdAndBlockerId(UUID userId, UUID blockerId);

    @Query("""
        SELECT CASE
            WHEN b.blockerId = :currentUserId THEN b.userId
            ELSE b.blockerId
        END
        FROM Block b
        WHERE 
            (b.blockerId = :currentUserId AND b.userId IN :targetUserIds)
            OR
            (b.userId = :currentUserId AND b.blockerId IN :targetUserIds)
    """)
    List<UUID> findBlockedIds(
            @Param("currentUserId") UUID currentUserId,
            @Param("targetUserIds") List<UUID> targetUserIds
    );

    @Query("""
        SELECT COUNT(b) > 0
        FROM Block b
        WHERE 
            (b.blockerId = :currentUserId AND b.userId = :targetUserId)
            OR
            (b.userId = :currentUserId AND b.blockerId = :targetUserId)
    """)
    boolean existsBlock(
            @Param("currentUserId") UUID currentUserId,
            @Param("targetUserId") UUID targetUserId
    );

    @Query("""
            SELECT b.blockerId
            FROM Block b
            WHERE b.userId = :currentUserId
            """)
    List<UUID> findCurrentBlockerIds(
            @Param("currentUserId") UUID currentUserId
    );
}
