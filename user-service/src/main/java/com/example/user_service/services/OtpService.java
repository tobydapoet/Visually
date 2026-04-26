package com.example.user_service.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {
    private final RedisTemplate<String, String> redisTemplate;

    private static final String OTP_PREFIX     = "2fa:otp:";
    private static final String ATTEMPT_PREFIX = "2fa:attempts:";
    private static final long   OTP_TTL        = 5;
    private static final long   ATTEMPT_TTL    = 15;
    private static final int    MAX_ATTEMPTS   = 5;
    public String generateAndStore(String email) {
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        redisTemplate.opsForValue()
                .set(OTP_PREFIX + email, otp, Duration.ofMinutes(OTP_TTL));
        redisTemplate.delete(ATTEMPT_PREFIX + email);
        return otp;
    }

    public VerifyResult verify(String email, String inputOtp) {
        String attemptKey = ATTEMPT_PREFIX + email;

        Long attempts = redisTemplate.opsForValue().increment(attemptKey);
        if (attempts == 1) {
            redisTemplate.expire(attemptKey, Duration.ofMinutes(ATTEMPT_TTL));
        }
        if (attempts > MAX_ATTEMPTS) {
            return VerifyResult.TOO_MANY_ATTEMPTS;
        }

        String stored = redisTemplate.opsForValue().get(OTP_PREFIX + email);
        if (stored == null)             return VerifyResult.EXPIRED;
        if (!stored.equals(inputOtp))   return VerifyResult.INVALID;

        redisTemplate.delete(OTP_PREFIX + email);
        redisTemplate.delete(attemptKey);
        return VerifyResult.SUCCESS;
    }

    public enum VerifyResult {
        SUCCESS,
        INVALID,
        EXPIRED,
        TOO_MANY_ATTEMPTS
    }
}
