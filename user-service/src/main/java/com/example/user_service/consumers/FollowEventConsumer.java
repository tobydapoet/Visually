package com.example.user_service.consumers;

import com.example.user_service.entities.User;
import com.example.user_service.repositories.UserRepository;
import com.example.user_service.requests.FollowEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowEventConsumer {

    @Autowired
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();


    @KafkaListener(topics = "follow.created", groupId = "user-service")
    public void handleFollow(String message) throws JsonProcessingException {
        FollowEvent event = objectMapper.readValue(message, FollowEvent.class);
        UUID followerId = event.getFollowerId();
        UUID followedId = event.getUserId();
        User follower = userRepository.findById(followerId).orElseThrow();
        User followed = userRepository.findById(followedId).orElseThrow();

        follower.setFollowing(follower.getFollowing() + 1);
        followed.setFollowers(followed.getFollowers() + 1);

        userRepository.save(follower);
        userRepository.save(followed);
    }

    @KafkaListener(topics = "follow.deleted", groupId = "user-service")
    public void handleUnfollow(String message) throws JsonProcessingException {
        FollowEvent event = objectMapper.readValue(message, FollowEvent.class);

        UUID followerId = event.getFollowerId();
        UUID followedId = event.getUserId();

        User follower = userRepository.findById(followerId).orElseThrow();
        User followed = userRepository.findById(followedId).orElseThrow();

        follower.setFollowing(follower.getFollowing() - 1);
        followed.setFollowers(followed.getFollowers() - 1);

        userRepository.save(follower);
        userRepository.save(followed);
    }
}

