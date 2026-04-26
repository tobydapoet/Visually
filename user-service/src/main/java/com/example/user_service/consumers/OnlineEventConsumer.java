package com.example.user_service.consumers;

import com.example.user_service.entities.User;
import com.example.user_service.exceptions.NotFoundException;
import com.example.user_service.repositories.UserRepository;
import com.example.user_service.requests.FollowEvent;
import com.example.user_service.requests.UserStatusEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OnlineEventConsumer {
    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "user.status.changed", groupId = "user-service")
    public void handleStatusChanged(String message) throws JsonProcessingException {
        UserStatusEvent event = objectMapper.readValue(message, UserStatusEvent.class);

        User user = userRepository.findById(event.getUserId())
                .orElseThrow(() -> new RuntimeException("Can't find user with id: " + event.getUserId()));

        user.setLastSeen(event.getLastSeen());
        userRepository.save(user);
    }
}
