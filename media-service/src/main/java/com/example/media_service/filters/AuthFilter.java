package com.example.media_service.filters;

import com.example.media_service.contexts.AuthContext;
import com.example.media_service.requests.CurrentUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class AuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String sessionId = request.getHeader("X-Session-Id");
        String role = request.getHeader("X-User-Role");

        Long sessionIdLong = null;
        if (sessionId != null && !sessionId.isBlank()) {
            try {
                sessionIdLong = Long.parseLong(sessionId);
            } catch (NumberFormatException e) {
                System.out.println("Invalid sessionId: " + sessionId);
            }
        }

        if (userId == null) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        CurrentUser currentUser = new CurrentUser(
                UUID.fromString(userId),
                sessionIdLong,
                role);

        AuthContext.set(currentUser);

        try {
            filterChain.doFilter(request, response);
        } finally {
            AuthContext.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator")
                || path.startsWith("/health")
                || path.contains("/v3/api-docs")
                || path.contains("swagger");
    }
}
