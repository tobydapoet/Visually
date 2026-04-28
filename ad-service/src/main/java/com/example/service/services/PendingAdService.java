package com.example.service.services;

import com.example.service.requests.CreateAdDto;
import com.example.service.requests.PendingAdData;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Log4j2
@Service
@RequiredArgsConstructor
public class PendingAdService {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String PENDING_AD_KEY = "pending:ad:";
    private static final long EXPIRE_MINUTES = 30;

    public void save(UUID userId, String username, CreateAdDto dto) {
        PendingAdData data = new PendingAdData(username, dto);
        redisTemplate.opsForValue().set(
                PENDING_AD_KEY + userId,
                data,
                EXPIRE_MINUTES,
                TimeUnit.MINUTES
        );
    }

    public PendingAdData get(UUID userId) {
        Object raw = redisTemplate.opsForValue().get(PENDING_AD_KEY + userId);
        if (raw == null) return null;

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper.convertValue(raw, PendingAdData.class);
    }

    public void delete(UUID userId) {
        redisTemplate.delete(PENDING_AD_KEY + userId);
    }
}
