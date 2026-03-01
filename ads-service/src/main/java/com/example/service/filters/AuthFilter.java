package com.example.service.filters;

import com.example.service.contexts.AuthContext;
import com.example.service.requests.CurrentUser;
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

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String sessionId = request.getHeader("X-Session-Id");
        String roles = request.getHeader("X-User-Roles");

        if (userId == null || sessionId == null) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        CurrentUser currentUser = new CurrentUser(
                UUID.fromString(userId),
                Long.parseLong(sessionId),
                roles != null ? List.of(roles.split(",")) : List.of()
        );

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
        System.out.println("🔍 Ads shouldNotFilter check: " + path);
        return path.startsWith("/actuator")
                || path.contains("/v3/api-docs")
                || path.contains("swagger");

    }
}
