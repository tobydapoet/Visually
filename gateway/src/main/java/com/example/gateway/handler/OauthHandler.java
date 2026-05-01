package com.example.gateway.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class OauthHandler implements AuthenticationSuccessHandler {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${REDIRECT_FE}")
    private String frontendUrls;

    private List<String> getAllowedUrls() {
        return Arrays.stream(frontendUrls.split(","))
                .map(url -> url.endsWith("/") ? url : url + "/")
                .toList();
    }

    private String resolveFrontendUrl(HttpServletRequest req) {
        Cookie[] cookies = req.getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("redirect_uri".equals(cookie.getName())) {
                    String redirectUri = cookie.getValue();

                    boolean isAllowed = getAllowedUrls().stream()
                            .anyMatch(redirectUri::startsWith);

                    if (isAllowed) {
                        return redirectUri.endsWith("/") ? redirectUri : redirectUri + "/";
                    }
                }
            }
        }

        return getAllowedUrls().get(0);
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest req,
            HttpServletResponse res,
            Authentication auth) throws IOException {

        try {
            String frontendUrl = resolveFrontendUrl(req);
            OAuth2User user = (OAuth2User) auth.getPrincipal();
            Map<String, Object> payload = Map.of(
                    "email", user.getAttribute("email"),
                    "fullName", user.getAttribute("name"),
                    "avatarUrl", user.getAttribute("picture"),
                    "providerId", user.getAttribute("sub"),
                    "provider", "GOOGLE");

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://USER-SERVICE/auth/google/login",
                    payload,
                    Map.class);

            String accessToken = (String) response.getBody().get("accessToken");
            String refreshToken = (String) response.getBody().get("refreshToken");

            res.sendRedirect(
                    frontendUrl + "oauth_success?accessToken=" + accessToken + "&refreshToken=" + refreshToken);

        } catch (Exception e) {
            e.printStackTrace();
            res.sendRedirect(getAllowedUrls().get(0) + "login?error=true");
        }
    }

}
