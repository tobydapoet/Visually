package com.example.gateway;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RestController
public class AuthController {

    @GetMapping("/test")
    public String test() {
        return "Gateway is working!";
    }

    @GetMapping("/auth/google/init")
    public void initOAuth(
            @RequestParam String redirectUri,
            HttpServletRequest req,
            HttpServletResponse res) throws IOException {

        String encodedState = Base64.getEncoder()
                .encodeToString(redirectUri.getBytes(StandardCharsets.UTF_8));
        res.sendRedirect("/oauth2/authorization/google?state=" + encodedState);
    }
}
