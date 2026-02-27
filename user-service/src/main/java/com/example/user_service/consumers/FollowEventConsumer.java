package com.example.user_service.consumers;

import com.example.user_service.entities.User;
import com.example.user_service.repositories.UserRepository;
import com.example.user_service.requests.FollowEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowEventConsumer {

    @Autowired
    private UserRepository userRepository;

    @KafkaListener(topics = "follow-events", groupId = "follower-service")
    public void consume(FollowEvent event) {

        UUID followerId = event.getFollowerId();
        UUID followedId = event.getFollowedId();

        User follower = userRepository.findById(followerId).orElseThrow();
        User followed = userRepository.findById(followedId).orElseThrow();

        if ("FOLLOW".equals(event.getType())) {
            follower.setFollowing(follower.getFollowing() + 1);
            followed.setFollowers(followed.getFollowers() + 1);
        }

        if ("UNFOLLOW".equals(event.getType())) {
            follower.setFollowing(follower.getFollowing() - 1);
            followed.setFollowers(followed.getFollowers() - 1);
        }

        userRepository.save(follower);
        userRepository.save(followed);
    }
}

