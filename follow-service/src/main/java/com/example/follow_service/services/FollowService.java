package com.example.follow_service.services;

import com.example.follow_service.clients.UserClient;
import com.example.follow_service.entities.Block;
import com.example.follow_service.entities.Follow;
import com.example.follow_service.enums.FollowType;
import com.example.follow_service.exceptions.ConflictException;
import com.example.follow_service.producers.FollowEventProducer;
import com.example.follow_service.repositories.FollowRepository;
import com.example.follow_service.requests.FollowNotificationEvent;
import com.example.follow_service.responses.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
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
                                                event.getFollowerId())
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
                Follow follow = followRepository.findByUserIdAndFollowerId(userId, followerId)
                                .orElseThrow(() -> new ConflictException("Follow not found"));
                followRepository.deleteById(follow.getId());
                producer.emitUnfollow(followerId, userId);
                return true;
        }

        public FollowInfoResponse isFollowed(UUID userId, UUID followerId) {
                boolean isFollow = false;
                if (userId != null) {
                        isFollow = followRepository.findByUserIdAndFollowerId(userId, followerId).isPresent();
                }
                long followers = followRepository.countByUserId(userId);
                long following = followRepository.countByFollowerId(userId);

                return new FollowInfoResponse(isFollow, followers, following);
        }

        public Long countByUserId(UUID userId) {
                return followRepository.countByUserId(userId);
        }

        public boolean isFollowedBool(UUID userId, UUID targetUserId) {
                return followRepository
                                .findByUserIdAndFollowerId(targetUserId, userId)
                                .isPresent();
        }

        public Map<String, Long> getFollowCount(UUID userId) {
                long following = followRepository.countByFollowerId(userId);
                long followers = followRepository.countByUserId(userId);

                Map<String, Long> result = new HashMap<>();
                result.put("following", following);
                result.put("followers", followers);

                return result;
        }

        public Page<UserResponse> getCurrentFollowers(
                        UUID userId,
                        int page,
                        int size,
                        FollowType type) {
                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                Sort.by(Sort.Direction.DESC, "createdAt"));

                Page<Follow> follows;

                if (type == FollowType.FOLLOWER) {
                        follows = followRepository.findAllByUserId(userId, pageable);
                } else {
                        follows = followRepository.findAllByFollowerId(userId, pageable);
                }

                if (follows.isEmpty()) {
                        return Page.empty(pageable);
                }

                String ids = follows.getContent()
                                .stream()
                                .map(f -> type == FollowType.FOLLOWER
                                                ? f.getFollowerId().toString()
                                                : f.getUserId().toString())
                                .collect(Collectors.joining(","));

                List<UserResponse> users = userClient.getUsers(ids, userId);

                return new PageImpl<>(
                                users,
                                pageable,
                                follows.getTotalElements());
        }

        private Page<FollowResponse> buildFollowPage(
                        UUID currentUserId,
                        List<UUID> targetIds,
                        Page<Follow> follows,
                        Function<Follow, UUID> idExtractor,
                        Pageable pageable,
                        String search) {
                if (targetIds.isEmpty())
                        return Page.empty(pageable);

                List<UserResponse> users = userClient.getUsers(
                                targetIds.stream().map(UUID::toString).collect(Collectors.joining(",")),
                                currentUserId);

                if (search != null && !search.isBlank()) {
                        String keyword = search.toLowerCase().trim();
                        users = users.stream()
                                        .filter(u -> u.getUsername().toLowerCase().contains(keyword) ||
                                                        u.getFullName().toLowerCase().contains(keyword))
                                        .toList();
                }

                Set<UUID> followedByCurrentUser = new HashSet<>();
                if (currentUserId != null && !users.isEmpty()) {
                        List<UUID> filteredIds = users.stream().map(UserResponse::getId).toList();
                        followedByCurrentUser = followRepository
                                        .findByFollowerIdAndUserIdIn(currentUserId, filteredIds)
                                        .stream()
                                        .map(Follow::getUserId)
                                        .collect(Collectors.toSet());
                }

                Set<UUID> finalFollowed = followedByCurrentUser;
                Map<UUID, UserWithFollowResponse> userMap = users.stream()
                                .map(u -> UserWithFollowResponse.from(u, finalFollowed.contains(u.getId())))
                                .collect(Collectors.toMap(UserWithFollowResponse::getId, u -> u));

                List<FollowResponse> content = follows.getContent().stream()
                                .map(idExtractor)
                                .filter(userMap::containsKey)
                                .map(id -> new FollowResponse(id, userMap.get(id),
                                                follows.getContent().stream()
                                                                .filter(f -> idExtractor.apply(f).equals(id))
                                                                .findFirst()
                                                                .map(Follow::getCreatedAt)
                                                                .orElse(null)))
                                .toList();

                return new PageImpl<>(content, pageable,
                                search != null && !search.isBlank() ? content.size() : follows.getTotalElements());
        }

        private Page<FollowResponse> buildFollowPageFromIds(
                        UUID currentUserId,
                        List<UUID> targetIds,
                        Pageable pageable,
                        String search,
                        long total) {
                if (targetIds.isEmpty())
                        return Page.empty(pageable);

                List<UserResponse> users = userClient.getUsers(
                                targetIds.stream().map(UUID::toString).collect(Collectors.joining(",")),
                                currentUserId);

                if (search != null && !search.isBlank()) {
                        String keyword = search.toLowerCase().trim();
                        users = users.stream()
                                        .filter(u -> u.getUsername().toLowerCase().contains(keyword) ||
                                                        u.getFullName().toLowerCase().contains(keyword))
                                        .toList();
                }

                Set<UUID> followedByCurrentUser = followRepository
                                .findByFollowerIdAndUserIdIn(
                                                currentUserId,
                                                users.stream().map(UserResponse::getId).toList())
                                .stream()
                                .map(Follow::getUserId)
                                .collect(Collectors.toSet());

                List<FollowResponse> content = users.stream()
                                .map(u -> new FollowResponse(
                                                u.getId(),
                                                UserWithFollowResponse.from(
                                                                u,
                                                                followedByCurrentUser.contains(u.getId())),
                                                null))
                                .toList();

                return new PageImpl<>(content, pageable, total);
        }

        public Page<FollowResponse> findAllByUserId(
                        UUID currentUserId,
                        UUID userId,
                        int page,
                        int size,
                        String search) {
                Pageable pageable = PageRequest.of(page, size);

                Page<UUID> idPage = followRepository.findFollowingIds(userId, pageable);

                return buildFollowPageFromIds(
                                currentUserId,
                                idPage.getContent(),
                                pageable,
                                search,
                                idPage.getTotalElements());
        }

        public Page<FollowResponse> findAllByFollowerId(
                        UUID currentUserId,
                        UUID userId,
                        int page,
                        int size,
                        String search) {
                Pageable pageable = PageRequest.of(page, size);

                Page<UUID> idPage = followRepository.findFollowerIds(userId, pageable);

                return buildFollowPageFromIds(
                                currentUserId,
                                idPage.getContent(),
                                pageable,
                                search,
                                idPage.getTotalElements());
        }

        public Page<UserSummaryStatusResponse> findCurrentUserFollowing(
                        UUID currentUserId,
                        int page,
                        int size) {
                Pageable pageable = PageRequest.of(page, size);

                Page<UUID> idPage = followRepository.findFollowingIds(currentUserId, pageable);
                List<UUID> ids = idPage.getContent();

                if (ids.isEmpty()) {
                        return new PageImpl<>(Collections.emptyList(), pageable, 0);
                }

                String idsParam = ids.stream()
                                .map(UUID::toString)
                                .collect(Collectors.joining(","));

                List<UserSummaryStatusResponse> users = userClient.getUsersWithStatus(idsParam, currentUserId);

                Map<UUID, UserSummaryStatusResponse> map = users.stream().collect(Collectors.toMap(
                                UserSummaryStatusResponse::getId,
                                u -> u));

                List<UserSummaryStatusResponse> result = ids.stream()
                                .map(map::get)
                                .filter(Objects::nonNull)
                                .toList();

                return new PageImpl<>(result, pageable, idPage.getTotalElements());
        }

        @Transactional
        public Block blockUser(UUID userId, UUID blockerId) {
                if (isFollowedBool(blockerId, userId)) {
                        delete(userId, blockerId);
                }
                if (isFollowedBool(userId, blockerId)) {
                        delete(blockerId, userId);
                }

                return blockService.save(userId, blockerId);
        }

        public Page<UUID> getFollowerIdByUserId(
                        UUID userId, Integer page, Integer size) {
                Pageable pageable = PageRequest.of(page, size);
                return followRepository.findFollowingIds(userId, pageable);
        }

        public Page<FollowResponse> findBothByFollowerId(
                        UUID currentUserId, int page, int size, String search) {
                Pageable pageable = PageRequest.of(page, size);

                Page<UUID> idPage = followRepository.findRelatedUserIds(currentUserId, pageable);

                List<UUID> ids = idPage.getContent();

                return buildFollowPageFromIds(
                                currentUserId,
                                ids,
                                pageable,
                                search,
                                idPage.getTotalElements());
        }

        public Page<FollowResponse> findMutualFollows(
                        UUID currentUserId, int page, int size, String search) {
                Pageable pageable = PageRequest.of(page, size);

                Page<UUID> idPage = followRepository.findMutualFollows(currentUserId, pageable);

                List<UUID> ids = idPage.getContent();

                return buildFollowPageFromIds(
                                currentUserId,
                                ids,
                                pageable,
                                search,
                                idPage.getTotalElements());
        }

}
