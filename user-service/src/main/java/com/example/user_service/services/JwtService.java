package com.example.user_service.services;

import com.example.user_service.entities.Session;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {
    @Value("${JWT_SECRET}")
    private String SECRET;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    private final long accessTokenValidity = 30L * 24 * 3600 * 1000;

    public String generateAccessToken(Session session) {
        List<String> roleNames = session.getUser().getRoles()
                .stream()
                .map(role -> role.getName().name())
                .toList();
        return Jwts.builder()
                .setSubject(session.getId().toString())
                .claim("userId", session.getUser().getId())
                .claim("roles", roleNames)
                .claim("avatarUrl", session.getUser().getAvatarUrl())
                .claim("username", session.getUser().getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenValidity))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()), SignatureAlgorithm.HS256)
                .compact();
    }
    public String generateRefreshToken() {
        byte[] randomBytes = new byte[64];
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
