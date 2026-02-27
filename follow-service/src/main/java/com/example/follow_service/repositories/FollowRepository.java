package com.example.follow_service.repositories;

import com.example.follow_service.entities.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow,Long> {
    Optional<Follow> findByUserIdAndFollowerId(UUID userId, UUID followerId);
    Page<Follow> findAllByFollowerId(UUID followerId, Pageable pageable);
    Page<Follow> findAllByUserId(UUID userId, Pageable pageable);
    List<Follow> findByFollowerIdAndUserIdIn(UUID followerId, List<UUID> userIds);
}
