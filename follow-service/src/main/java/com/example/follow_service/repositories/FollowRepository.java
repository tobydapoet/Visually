package com.example.follow_service.repositories;

import com.example.follow_service.entities.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow,Long> {
    Optional<Follow> findByUserIdAndFollowerId(UUID userId, UUID followerId);
    Page<Follow> findAllByFollowerId(UUID followerId, Pageable pageable);
    Page<Follow> findAllByUserId(UUID userId, Pageable pageable);
    @Query("""
        SELECT f.userId FROM Follow f
        WHERE f.followerId = :userId
        ORDER BY f.createdAt DESC
        """)
    Page<UUID> findFollowingIds(
            @Param("userId") UUID userId,
            Pageable pageable
    );


    @Query("""
        SELECT f.followerId FROM Follow f
        WHERE f.userId = :userId
        ORDER BY f.createdAt DESC
        """)
    Page<UUID> findFollowerIds(
            @Param("userId") UUID userId,
            Pageable pageable
    );
    List<Follow> findByFollowerIdAndUserIdIn(UUID followerId, List<UUID> userIds);

    @Query("""
        SELECT DISTINCT 
            CASE 
                WHEN f.userId = :userId THEN f.followerId 
                ELSE f.userId 
            END
        FROM Follow f
        WHERE f.userId = :userId 
           OR f.followerId = :userId
        """)
    Page<UUID> findRelatedUserIds(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    @Query("""
        SELECT f1.followerId
        FROM Follow f1
        JOIN Follow f2 
            ON f1.followerId = f2.userId
        WHERE f1.userId = :userId
          AND f2.followerId = :userId
    """)
    Page<UUID> findMutualFollows(
            @Param("userId") UUID userId,
            Pageable pageable
    );

    long countByFollowerId(UUID followerId);

    long countByUserId(UUID userId);
}
