package com.example.user_service.controllers;

import com.example.user_service.exceptions.UnauthorizedException;
import com.example.user_service.requests.GoogleRequest;
import com.example.user_service.requests.LoginRequest;
import com.example.user_service.requests.RegisterRequest;
import com.example.user_service.entities.User;
import com.example.user_service.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequest req) {
        Map<String, String> tokens = userService.login(req);
        return ResponseEntity.ok(Map.of(
                "message", "Login success",
                "accessToken", tokens.get("accessToken"),
                "refreshToken", tokens.get("refreshToken")
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody @Valid RegisterRequest req) {
        User user = userService.register(req);
        if (user != null) {
            return ResponseEntity.ok(Map.of(
                    "message", "Register success"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Register failed"
            ));
        }
    }

    @DeleteMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("X-Session-Id") Long sesionId) {
        userService.logout(sesionId);
        return ResponseEntity.ok(Map.of(
                "message", "Logout success"
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Unauthorized");
        }

        String token = authHeader.substring(7).trim();
        String newAccessToken = userService.refreshToken(token);

        return ResponseEntity.ok(Map.of(
                "message", "Refresh success",
                "accessToken", newAccessToken
        ));
    }

    @PostMapping("/google/login")
    public ResponseEntity<Map<String, String>> googleLogin(@RequestBody GoogleRequest req) {
        Map<String, String> tokens = userService.loginWithGoogle(req);
        return ResponseEntity.ok(Map.of(
                "accessToken", tokens.get("accessToken"),
                "refreshToken", tokens.get("refreshToken")
        ));
    }
}
