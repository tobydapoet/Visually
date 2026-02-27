package com.example.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

@Component
public class JwtUtils {
    @Value("${jwt.secret}")
    private String SECRET;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = SECRET.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        return (List<String>) claims.get("roles");
    }

    public String extractSubject(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("sub");
    }

    public String extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("userId");
    }

    public String extractAvatarUrl(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("avatarUrl");
    }

    public String extractUsername(String token) {
        Claims claims = extractAllClaims(token);
        return (String) claims.get("username");
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Boolean isExpirationToken(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token) {
        try {
            return !isExpirationToken(token);
        } catch (Exception e) {
            return false;
        }
    }

    public Boolean validateToken(String token, String username) {
        final String tokenUserId = extractUserId(token);
        return (tokenUserId.equals(username) && !isExpirationToken(token));
    }
}
