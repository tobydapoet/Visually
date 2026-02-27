package com.example.follow_service.services;

import com.example.follow_service.clients.UserClient;
import com.example.follow_service.entities.Follow;
import com.example.follow_service.enums.FollowType;
import com.example.follow_service.exceptions.ConflictException;
import com.example.follow_service.producers.FollowEventProducer;
import com.example.follow_service.repositories.FollowRepository;
import com.example.follow_service.requests.FollowEvent;
import com.example.follow_service.requests.FollowNotificationEvent;
import com.example.follow_service.responses.FollowResponse;
import com.example.follow_service.responses.UserResponse;
import com.example.follow_service.responses.UserWithFollowResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FollowService {
    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private BlockService blockService;

    @Autowired
    private UserClient userClient;

    @Autowired
    private FollowEventProducer producer;

    @Transactional
    public Follow save(FollowNotificationEvent event) {

        followRepository
                .findByUserIdAndFollowerId(
                        event.getFollowedId(),
                        event.getFollowerId()
                )
                .ifPresent(f -> {
                    throw new ConflictException("Already followed");
                });

        Follow follow = new Follow();
        follow.setFollowerId(event.getFollowerId());
        follow.setUserId(event.getFollowedId());

        followRepository.save(follow);

        producer.emitFollow(event.getFollowerId(), event.getFollowedId());
        producer.emitFollowNotification(event);

        return follow;
    }

    public boolean delete(UUID userId, UUID followerId) {
        Follow follow = followRepository.findByUserIdAndFollowerId(userId, followerId).orElseThrow(()->new ConflictException("Follow not found"));
        followRepository.deleteById(follow.getId());
        producer.emitUnfollow(followerId, userId);
        return true;
    }

    public Map<String, String> isFollowed(UUID userId, UUID followerId) {
        Optional<Follow> followOpt =
                followRepository.findByUserIdAndFollowerId(userId, followerId);

        Map<String, String> map = new HashMap<>();
        map.put("isFollow", followOpt.isPresent() ? "true" : "false");

        return map;
    }

    public boolean isFollowedBool(UUID userId, UUID targetUserId) {
        return followRepository
                .findByUserIdAndFollowerId(targetUserId, userId)
                .isPresent();
    }

    public Map<String, Boolean> isFollowedNoBlock(UUID userId, UUID targetUserId) {
        boolean isFollowed = isFollowedBool(userId, targetUserId);

        boolean isUserBlockedTarget = blockService.isBlockedBool(userId, targetUserId);
        boolean isTargetBlockedUser = blockService.isBlockedBool(targetUserId, userId);

        boolean isFollowedNoBlock = isFollowed && !isUserBlockedTarget && !isTargetBlockedUser;

        Map<String, Boolean> map = new HashMap<>();
        map.put("isFollowedNoBlock", isFollowedNoBlock);

        return map;
    }

    public Page<UserResponse> getCurrentFollowers(
            UUID userId,
            int page,
            int size,
            FollowType type,
            String roles,
            Long sessionId
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Follow> follows;

        if (type == FollowType.FOLLOWER) {
            follows = followRepository.findAllByUserId(userId, pageable);
        } else {
            follows = followRepository.findAllByFollowerId(userId, pageable);
        }

        if (follows.isEmpty()) {
            return Page.empty(pageable);
        }

        String followerIds = follows.getContent()
                .stream()
                .map(f -> f.getFollowerId().toString())
                .collect(Collectors.joining(","));

        List<UserResponse> users =
                userClient.getUsers(followerIds, userId, roles, sessionId);

        return new PageImpl<>(
                users,
                pageable,
                follows.getTotalElements()
        );
    }



    public Page<FollowResponse> findAllByFollowerId(UUID currentUserId, UUID followerId, int page, int size, String roles, Long sessionId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Follow> follows = followRepository.findAllByFollowerId(followerId, pageable);

        List<UUID> userIds = follows.getContent()
                .stream()
                .map(Follow::getUserId)
                .distinct()
                .toList();

        System.out.println("😀 userIds Count= " + userIds.size());
        System.out.println("😀 userIds= " + userIds);

        Set<UUID> followedByCurrentUser = new HashSet<>();
        if (currentUserId != null && !userIds.isEmpty()) {
            System.out.println("😀 currentUserId= " + currentUserId);

            List<Follow> currentUserFollows = followRepository.findByFollowerIdAndUserIdIn(currentUserId, userIds);

            System.out.println("😀 currentUserFollows Count= " + currentUserFollows.size());

            followedByCurrentUser = currentUserFollows.stream()
                    .map(Follow::getUserId)
                    .collect(Collectors.toSet());

            System.out.println("😀 followedByCurrentUser= " + followedByCurrentUser);
        }

        String idsString = userIds.stream().map(UUID::toString).collect(Collectors.joining(","));
        System.out.println("😀 Calling userClient.getUsers with ids= " + idsString);

        List<UserResponse> users = userClient.getUsers(idsString, currentUserId, roles, sessionId);
        System.out.println("😀 users Count= " + users.size());

        Set<UUID> finalFollowedByCurrentUser = followedByCurrentUser;
        Map<UUID, UserWithFollowResponse> userMap = users.stream()
                .map(u -> {
                    Boolean isFollowed = finalFollowedByCurrentUser.contains(u.getId());
                    UserWithFollowResponse userWithFollow = UserWithFollowResponse.from(u, isFollowed);
                    System.out.println("😀 User " + userWithFollow.getUsername() + " (ID: " + userWithFollow.getId() + ") - isFollowed: " + isFollowed);
                    return userWithFollow;
                })
                .collect(Collectors.toMap(UserWithFollowResponse::getId, u -> u));

        List<FollowResponse> content = follows.getContent().stream()
                .map(f -> new FollowResponse(
                        f.getUserId(),
                        userMap.get(f.getUserId()),
                        f.getCreatedAt()
                ))
                .toList();

        System.out.println("😀 Final content Count= " + content.size());

        return new PageImpl<>(content, pageable, follows.getTotalElements());
    }

    public Page<FollowResponse> findAllByUserId(UUID currentUserId, UUID userId, int page, int size, String roles, Long sessionId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Follow> follows = followRepository.findAllByUserId(userId, pageable);

        List<UUID> followerIds = follows.getContent()
                .stream()
                .map(Follow::getFollowerId)
                .distinct()
                .toList();

        if (followerIds.isEmpty()) {
            return Page.empty(pageable);
        }

        System.out.println("😀 followerIds Count= " + followerIds.size());
        System.out.println("😀 followerIds= " + followerIds);

        Set<UUID> followedByCurrentUser = new HashSet<>();
        if (currentUserId != null && !followerIds.isEmpty()) {
            System.out.println("😀 currentUserId= " + currentUserId);

            List<Follow> currentUserFollows = followRepository.findByFollowerIdAndUserIdIn(currentUserId, followerIds);

            System.out.println("😀 currentUserFollows Count= " + currentUserFollows.size());

            followedByCurrentUser = currentUserFollows.stream()
                    .map(Follow::getUserId)
                    .collect(Collectors.toSet());

            System.out.println("😀 followedByCurrentUser= " + followedByCurrentUser);
        }

        String idsString = followerIds.stream().map(UUID::toString).collect(Collectors.joining(","));
        System.out.println("😀 Calling userClient.getUsers with ids= " + idsString);

        List<UserResponse> users = userClient.getUsers(idsString, currentUserId, roles, sessionId);
        System.out.println("😀 users Count= " + users.size());

        Set<UUID> finalFollowedByCurrentUser = followedByCurrentUser;
        Map<UUID, UserWithFollowResponse> userMap = users.stream()
                .map(u -> {
                    Boolean isFollowed = finalFollowedByCurrentUser.contains(u.getId());
                    UserWithFollowResponse userWithFollow = UserWithFollowResponse.from(u, isFollowed);
                    System.out.println("😀 User " + userWithFollow.getUsername() + " (ID: " + userWithFollow.getId() + ") - isFollowed: " + isFollowed);
                    return userWithFollow;
                })
                .collect(Collectors.toMap(UserWithFollowResponse::getId, u -> u));

        List<FollowResponse> content = follows.getContent().stream()
                .map(f -> new FollowResponse(
                        f.getFollowerId(),
                        userMap.get(f.getFollowerId()),
                        f.getCreatedAt()
                ))
                .toList();

        System.out.println("😀 Final content Count= " + content.size());

        return new PageImpl<>(content, pageable, follows.getTotalElements());
    }
}
