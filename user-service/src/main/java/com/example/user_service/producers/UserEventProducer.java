package com.example.user_service.producers;

import com.example.user_service.requests.UserAvatarUpdateEvent;
import com.example.user_service.requests.UserProfileUpdatedEvent;
import com.example.user_service.requests.UserStatusUpdateEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void emitUserCreated( UserProfileUpdatedEvent event) {
        sendAfterCommit("user.created",event.getId()  ,event);
    }

    public void emitUserProfileUpdated(UserProfileUpdatedEvent event) {
        sendAfterCommit("user.updated.profile", event.getId() , event);
    }

    public void emitUserStatusUpdated(UserStatusUpdateEvent event) {
        sendAfterCommit("user.updated.status", event.getId(), event);
    }

    public void emitUserAvatarUpdated(UserAvatarUpdateEvent event) {
        sendAfterCommit("user.updated.avatar", event.getId(), event);
    }

    private void sendAfterCommit(String topic, UUID key, Object event) {

        if (key == null) {
            throw new IllegalArgumentException("Kafka key (userId) cannot be null");
        }

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            sendNow(topic, key, event);
                        }
                    }
            );
        } else {
            sendNow(topic, key, event);
        }
    }


    private void sendNow(String topic, UUID key, Object event) {
        kafkaTemplate
                .send(topic, key.toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info(
                                "Event sent | topic={} | key={} | partition={} | offset={}",
                                topic,
                                key,
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset()
                        );
                    } else {
                        log.error(
                                "Failed to send event | topic={} | key={}",
                                topic,
                                key,
                                ex
                        );
                    }
                });
    }
}
