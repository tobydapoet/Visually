package com.example.gateway.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.util.Map;

@Component
public class OauthHandler implements AuthenticationSuccessHandler {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestTemplate restTemplate;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest req,
            HttpServletResponse res,
            Authentication auth) throws IOException {

        try {
            OAuth2User user = (OAuth2User) auth.getPrincipal();
            Map<String, Object> payload = Map.of(
                    "email", user.getAttribute("email"),
                    "fullName", user.getAttribute("name"),
                    "avatarUrl", user.getAttribute("picture"),
                    "providerId", user.getAttribute("sub"),
                    "provider", "GOOGLE"
            );

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://USER-SERVICE/auth/google/login",
                    payload,
                    Map.class
            );

            res.setContentType("application/json");
            res.getWriter().write(
                    objectMapper.writeValueAsString(response.getBody())
            );
        } catch (Exception e) {
            e.printStackTrace();
            res.setStatus(500);
            res.getWriter().write("ERROR IN OAUTH HANDLER");
        }
    }

}
