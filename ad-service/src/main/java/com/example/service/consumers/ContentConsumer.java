package com.example.service.consumers;

import com.example.service.responses.ContentDeletedEvent;
import com.example.service.responses.ContentViewEvent;
import com.example.service.services.AdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class ContentConsumer {

    @Autowired
    private AdService adService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "content.deleted", groupId = "ad-group")
    public void handleContentDeleted(String message) {
        try {
            ContentDeletedEvent event =
                    objectMapper.readValue(message, ContentDeletedEvent.class);

            adService.handleContentDeleted(event);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @KafkaListener(topics = "content.viewed", groupId = "ad-service")
    public void handleContentView(String message) {
        try {
            ContentViewEvent event = objectMapper.readValue(message, ContentViewEvent.class);
            adService.AdView(event);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}