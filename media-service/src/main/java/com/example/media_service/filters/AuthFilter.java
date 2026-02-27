package com.example.media_service.filters;

import com.example.media_service.contexts.AuthContext;
import com.example.media_service.requests.CurrentUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

        if (userId == null) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }

        CurrentUser currentUser = new CurrentUser(
                UUID.fromString(userId),
                sessionId != null ? Long.parseLong(sessionId) : null,
                roles != null ? List.of(roles.split(",")) : List.of()
        );

        AuthContext.set(currentUser);

        List<SimpleGrantedAuthority> authorities = currentUser.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        try {
            filterChain.doFilter(request, response);
        } finally {
            AuthContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator")
                || path.startsWith("/health");
    }
}
