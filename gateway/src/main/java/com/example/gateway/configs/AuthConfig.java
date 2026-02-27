package com.example.gateway.configs;

import com.example.gateway.AuthFilter;
import com.example.gateway.handler.OauthHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class AuthConfig {

    @Autowired
    private AuthFilter authFilter;

    @Autowired
    private OauthHandler oauthHandler;

    @Bean
    public FilterRegistrationBean<AuthFilter> jwtFilter() {
        FilterRegistrationBean<AuthFilter> registrationBean =
                new FilterRegistrationBean<>();

        registrationBean.setFilter(authFilter);
        registrationBean.addUrlPatterns("/api/*");
        registrationBean.setOrder(1);

        return registrationBean;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )
                .oauth2Login(oauth -> oauth
                        .successHandler(oauthHandler)
                );
        ;

        return http.build();
    }
}