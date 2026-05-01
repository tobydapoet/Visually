package com.example.gateway;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

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

        req.getSession().setAttribute("redirect_uri", redirectUri);

        res.sendRedirect("/oauth2/authorization/google");
    }
}
