package com.example.service.consumers;

import com.example.service.responses.UserProfileUpdatedEvent;
import com.example.service.responses.UserStatusUpdateEvent;
import com.example.service.services.AdUserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class UserConsumer {

    @Autowired
    AdUserProfileService adUserProfileService;

    @KafkaListener(topics = "user.created", groupId = "ads-service")
            public void handleUserCreate(UserProfileUpdatedEvent event) {
        adUserProfileService.handleCreateUser(event);
    }

    @KafkaListener(topics = "user.updated.status", groupId = "ads-service")
    public void handleUpdateStatus(UserStatusUpdateEvent event) {
        adUserProfileService.handleUpdateStatus(event);
    }

    @KafkaListener(topics = "user.updated.profile", groupId = "ads-service")
    public void handleUpdateProfile(UserProfileUpdatedEvent event) {
        adUserProfileService.handleUpdateProfile(event);
    }
}
