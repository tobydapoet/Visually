package com.example.service.consumers;

import com.example.service.requests.UserUpdateEvent;
import com.example.service.responses.ContentDeletedEvent;
import com.example.service.services.AdService;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Log4j2
@Component
public class UserConsumer {
    @Autowired
    private AdService adService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "user.updated.detail", groupId = "ad-group")
    public void handleUpdateUsername(String message) {
        try {
            UserUpdateEvent event = objectMapper.readValue(message, UserUpdateEvent.class);
            adService.updateUsername(event);
        } catch (Exception e) {
            log.error("Failed to handle user update event: {}", e.getMessage());
        }
    }
}
