package com.example.gateway;

import com.example.gateway.wrapper.CustomHttpServletRequestWrapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class AuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    private static final List<String> EXCLUDE_URLS = List.of(
            "/api/users/auth/login",
            "/api/users/auth/register",
            "/api/users/auth/login",
            "/api/users/auth/register",
            "/api/users/google/login",
            "/api/users/oauth2/authorization/google",
            "/api/users/login/oauth2/code/google",
            "/api/public",
            "/actuator/health",
            "/api/users/auth/google/login",
            "/oauth2/authorization/google",
            "/login/oauth2/code/google"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();

        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║ JWT FILTER DEBUG INFO                                      ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("  Request URI    : " + path);
        System.out.println("  Request Method : " + request.getMethod());
        System.out.println("  EXCLUDE_URLS   : " + EXCLUDE_URLS);

        boolean shouldSkip = EXCLUDE_URLS.stream().anyMatch(path::startsWith);
        System.out.println("  Should Skip    : " + shouldSkip);

        String authHeader = request.getHeader("Authorization");
        System.out.println("  Auth Header    : " + (authHeader != null ? authHeader.substring(0, Math.min(20, authHeader.length())) + "..." : "NULL"));
        System.out.println("╚════════════════════════════════════════════════════════════╝");

        if (shouldSkip) {
            System.out.println("✓ SKIPPING AUTH - Public endpoint");
            chain.doFilter(request, response);
            return;
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("✗ REJECTED - Missing Authorization header");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Missing or invalid Authorization header\"}");
            response.getWriter().flush();
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtUtils.validateToken(token)) {
                System.out.println("✗ REJECTED - Invalid token");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\": \"Invalid or expired token\"}");
                response.getWriter().flush();
                return;
            }

            String sub = jwtUtils.extractSubject(token);
            String userId = jwtUtils.extractUserId(token);
            String avatarUrl = jwtUtils.extractAvatarUrl(token);
            String username  = jwtUtils.extractUsername(token);
            List<String> roles = jwtUtils.extractRoles(token);

            System.out.println("✓ AUTHENTICATED - Sub: " + sub + ", ID: " + userId);

            CustomHttpServletRequestWrapper wrappedRequest =
                    new CustomHttpServletRequestWrapper(request);

            wrappedRequest.addHeader("X-User-Id", userId);
            wrappedRequest.addHeader("X-User-Avatar", avatarUrl);
            wrappedRequest.addHeader("X-User-Username", username);
            wrappedRequest.addHeader("X-Session-Id", sub);
            wrappedRequest.addHeader("X-User-Roles", String.join(",", roles != null ? roles : List.of()));
            chain.doFilter(wrappedRequest, response);

        } catch (Exception e) {
            System.out.println("✗ ERROR - " + e.getMessage());
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\": \"Token validation failed: " + e.getMessage() + "\"}");
            response.getWriter().flush();
        }
    }
}