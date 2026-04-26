package com.example.follow_service;

import com.example.follow_service.events.ContentCreatedEvent;
import com.example.follow_service.events.ContentInteractionEvent;
import com.example.follow_service.events.FeedBatchEvent;
import com.example.follow_service.events.NotificationBatchEvent;
import com.example.follow_service.services.FollowService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class Consumers {
    private final ObjectMapper objectMapper;
    private final FollowService followService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public Consumers(FollowService followService,
                     KafkaTemplate<String, Object> kafkaTemplate,
                     ObjectMapper objectMapper) {
        this.followService = followService;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = "content.created", groupId = "follow-service")
    public void handleContentCreated(@Payload String message) {
        try {
            ContentCreatedEvent event = objectMapper.readValue(message, ContentCreatedEvent.class);
            log.info("📨 content.created received: {}", event);

            int page = 0;
            int batchSize = 1000;
            Page<UUID> followerIds;

            do {
                followerIds = followService.getFollowerIdByUserId(
                        UUID.fromString(event.getSenderId()), page, batchSize
                );

                List<String> ids = followerIds.getContent()
                        .stream()
                        .map(UUID::toString)
                        .toList();

                if (!followerIds.isEmpty()) {
                    kafkaTemplate.send("content.notification.created",
                            NotificationBatchEvent.builder()
                                    .followerIds(ids)
                                    .senderId(event.getSenderId())
                                    .username(event.getUsername())
                                    .avatarUrl(event.getAvatarUrl())
                                    .contentId(event.getContentId())
                                    .contentType(event.getContentType())
                                    .createdAt(event.getCreatedAt())
                                    .build()
                    );

                    long followerCount = followService.countByUserId(
                            UUID.fromString(event.getSenderId())
                    );
                    if(followerCount < 100){
                        kafkaTemplate.send("feed.home.created",
                                FeedBatchEvent.builder()
                                        .followerIds(ids)
                                        .contentId(event.getContentId())
                                        .contentType(event.getContentType())
                                        .timestamp(event.getCreatedAt())
                                        .likeCount(0L)
                                        .commentCount(0L)
                                        .saveCount(0L)
                                        .build()
                        );
                    }
                    else {
                        kafkaTemplate.send("feed.home.celebrity",
                                FeedBatchEvent.builder()
                                        .followerIds(ids)
                                        .contentId(event.getContentId())
                                        .contentType(event.getContentType())
                                        .timestamp(event.getCreatedAt())
                                        .likeCount(0L)
                                        .commentCount(0L)
                                        .saveCount(0L)
                                        .build()
                        );
                    }
                }
                page++;
            } while (followerIds.hasNext());

        } catch (Exception e) {
            log.error("Failed to deserialize content.created: {}", message, e);
        }
    }

    @KafkaListener(topics = "content.liked", groupId = "follow-service")
    public void  handleContentLiked(@Payload String message) {
        try {
            ContentInteractionEvent event = objectMapper.readValue(message, ContentInteractionEvent.class);
            log.info("📨 content.liked received: {}", event);
            int page = 0;
            int batchSize = 1000;
            Page<UUID> followerIds;

            do {
                followerIds = followService.getFollowerIdByUserId(
                        UUID.fromString(event.getSenderId()), page, batchSize
                );

                if (!followerIds.isEmpty()) {
                    long followerCount = followService.countByUserId(
                            UUID.fromString(event.getSenderId())
                    );
                    if(followerCount < 100){
                        kafkaTemplate.send("feed.home.interacted",
                                FeedBatchEvent.builder()
                                        .followerIds(followerIds.getContent()
                                                .stream()
                                                .map(UUID::toString)
                                                .toList())
                                        .contentId(event.getContentId())
                                        .contentType(event.getContentType())
                                        .timestamp(event.getTimestamp())
                                        .likeCount(event.getLikeCount())
                                        .commentCount(event.getCommentCount())
                                        .saveCount(event.getSaveCount())
                                        .build()
                        );
                    }
                    else {
                        kafkaTemplate.send("feed.home.celebrity",
                                FeedBatchEvent.builder()
                                        .followerIds(followerIds.getContent()
                                                .stream()
                                                .map(UUID::toString)
                                                .toList())
                                        .contentId(event.getContentId())
                                        .contentType(event.getContentType())
                                        .likeCount(event.getLikeCount())
                                        .commentCount(event.getCommentCount())
                                        .saveCount(event.getSaveCount())
                                        .timestamp(event.getTimestamp())
                                        .build()
                        );
                    }
                }
                page++;
            } while (followerIds.hasNext());
        } catch (Exception e) {
            log.error("Failed to deserialize content.liked: {}", message, e);
        }
    }


    @KafkaListener(topics = "content.commented", groupId = "follow-service")
    public void  handleContentCommented(@Payload String message) {
        try {
            ContentInteractionEvent event = objectMapper.readValue(message, ContentInteractionEvent.class);
            log.info("📨 content.commented received: {}", event);
            int page = 0;
            int batchSize = 1000;
            Page<UUID> followerIds;

            do {
                followerIds = followService.getFollowerIdByUserId(
                        UUID.fromString(event.getSenderId()), page, batchSize
                );

                if (!followerIds.isEmpty()) {
                    long followerCount = followService.countByUserId(
                            UUID.fromString(event.getSenderId())
                    );
                    if(followerCount < 100){
                        kafkaTemplate.send("feed.home.interacted",
                                FeedBatchEvent.builder()
                                        .followerIds(followerIds.getContent()
                                                .stream()
                                                .map(UUID::toString)
                                                .toList())
                                        .contentId(event.getContentId())
                                        .contentType(event.getContentType())
                                        .likeCount(event.getLikeCount())
                                        .commentCount(event.getCommentCount())
                                        .saveCount(event.getSaveCount())
                                        .timestamp(event.getTimestamp())
                                        .build()
                        );
                    }
                    else {
                        kafkaTemplate.send("feed.home.celebrity",
                                FeedBatchEvent.builder()
                                        .followerIds(followerIds.getContent()
                                                .stream()
                                                .map(UUID::toString)
                                                .toList())
                                        .contentId(event.getContentId())
                                        .contentType(event.getContentType())
                                        .likeCount(event.getLikeCount())
                                        .commentCount(event.getCommentCount())
                                        .saveCount(event.getSaveCount())
                                        .timestamp(event.getTimestamp())
                                        .build()
                        );
                    }
                }
                page++;
            } while (followerIds.hasNext());
        } catch (Exception e) {
            log.error("Failed to deserialize content.commented: {}", message, e);
        }
    }



}