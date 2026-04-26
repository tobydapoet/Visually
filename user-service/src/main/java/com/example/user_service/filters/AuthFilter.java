package com.example.user_service.filters;

import com.example.user_service.contexts.AuthContext;
import com.example.user_service.requests.CurrentUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class AuthFilter extends OncePerRequestFilter {
    private static final List<String> OPTIONAL_AUTH_PATHS = List.of(
            "/username/",
            "/search"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String userId = request.getHeader("X-User-Id");
        String sessionId = request.getHeader("X-Session-Id");
        String role = request.getHeader("X-User-Role");

        boolean isOptional = OPTIONAL_AUTH_PATHS.stream()
                .anyMatch(p -> request.getRequestURI().contains(p));

        if (userId == null && !isOptional) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        if (userId != null) {
            AuthContext.set(new CurrentUser(
                    UUID.fromString(userId),
                    sessionId != null ? Long.parseLong(sessionId) : null,
                    role
            ));
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            AuthContext.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        System.out.println("🔍 USER-SERVICE shouldNotFilter check: " + path);
        return path.startsWith("/actuator")
                || path.contains("/login")
                || path.contains("/register")
                || path.contains("/google")
                || path.contains("/summary")
                || path.contains("/batch")
                || path.contains("/v3/api-docs")
                || path.contains("swagger")
                || path.contains("refresh")
                || path.contains("otp")
                || path.contains("reset-password");
    }
}
