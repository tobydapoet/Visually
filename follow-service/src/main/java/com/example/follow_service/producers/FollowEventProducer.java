package com.example.follow_service.producers;

import com.example.follow_service.requests.FollowEvent;
import com.example.follow_service.requests.FollowNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowEventProducer {

    private final KafkaTemplate<String, FollowEvent> kafkaTemplate;

    private final KafkaTemplate<String, FollowNotificationEvent> notificationKafkaTemplate;

    public void emitFollow(UUID followerId, UUID followedId) {
        kafkaTemplate.send(
                "follow.created",
                followerId.toString(),
                new FollowEvent(followerId, followedId)
        ).whenComplete((result, ex) -> {  // ← 3. THÊM error handling
            if (ex == null) {
                log.info("Follow event sent: {} -> {} (partition: {}, offset: {})",
                        followerId, followedId,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send follow event: {} -> {}",
                        followerId, followedId, ex);
            }
        });
    }

    public void emitFollowNotification(FollowNotificationEvent event) {
        notificationKafkaTemplate.send(
                "follow.notification.created",
                event.getFollowerId().toString(),
                event
        ).whenComplete((result, ex) -> {  // ← 3. THÊM error handling
            if (ex == null) {
                log.info("Follow event sent: {} -> {} (partition: {}, offset: {})",
                        event.getFollowerId(), event.getFollowedId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send follow event: {} -> {}",
                        event.getFollowerId(), event.getFollowedId(), ex);
            }
        });
    }

    public void emitNotificationFollow(UUID followerId, UUID followedId) {
        kafkaTemplate.send(
                "follow.created",
                followerId.toString(),
                new FollowEvent(followerId, followedId)
        ).whenComplete((result, ex) -> {  // ← 3. THÊM error handling
            if (ex == null) {
                log.info("Follow event sent: {} -> {} (partition: {}, offset: {})",
                        followerId, followedId,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Failed to send follow event: {} -> {}",
                        followerId, followedId, ex);
            }
        });
    }

    public void emitUnfollow(UUID followerId, UUID followedId) {
        kafkaTemplate.send(
                "follow.deleted",
                followerId.toString(),
                new FollowEvent(followerId, followedId)
        )
                .whenComplete((result, ex) -> {  // ← THÊM error handling
                    if (ex == null) {
                        log.info("Unfollow event sent: {} -> {}", followerId, followedId);
                    } else {
                        log.error("Failed to send unfollow event: {} -> {}",
                                followerId, followedId, ex);
                    }
                });
        ;
    }
}

