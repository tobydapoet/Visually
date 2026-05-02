package com.example.user_service.controllers;

import com.example.user_service.exceptions.ConflictException;
import com.example.user_service.exceptions.NotFoundException;
import com.example.user_service.exceptions.UnauthorizedException;
import com.example.user_service.requests.*;
import com.example.user_service.entities.User;
import com.example.user_service.services.JwtService;
import com.example.user_service.services.MailService;
import com.example.user_service.services.OtpService;
import com.example.user_service.services.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private MailService mailService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private JwtService jwtService;

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

    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("X-Session-Id") Long sessionId) {
        userService.logout(sessionId);
        return ResponseEntity.ok(Map.of(
                "message", "Logout success"
        ));
    }

    @SecurityRequirement(name = "bearerAuth")
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


    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @RequestBody @Valid OtpReq req) {

        OtpService.VerifyResult result =
                otpService.verify(req.getEmail(), req.getOtp());

        return switch (result) {
            case SUCCESS -> {
                String resetToken =
                        jwtService.generateResetToken(req.getEmail());

                yield ResponseEntity.ok(
                        Map.of(
                                "message", "Verification successful",
                                "resetToken", resetToken
                        )
                );
            }

            case INVALID ->
                    ResponseEntity.status(401)
                            .body(Map.of("message", "Invalid OTP"));

            case EXPIRED ->
                    ResponseEntity.status(401)
                            .body(Map.of("message", "OTP has expired"));

            case TOO_MANY_ATTEMPTS ->
                    ResponseEntity.status(429)
                            .body(Map.of(
                                    "message",
                                    "Too many attempts, please log in again"
                            ));
        };
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody @Valid ResetPasswordReq req) {

        userService.resetPassword(req);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Password reset successfully"
                )
        );
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>>resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userService.findByEmail(email);
        if(user == null) {
            throw new NotFoundException("Can't find this email");
        }
        if(user.getProviderId() != null) {
            throw new ConflictException("This account can't resend your otp");
        }
        String otp = otpService.generateAndStore(email);
        mailService.sendOtp(email, otp);
        return ResponseEntity.ok(Map.of("message", "OTP has been resent"));
    }
}
