package com.example.gateway;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.function.*;

import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

@Configuration
public class Routes {

    @Autowired
    private RestTemplate restTemplate;

    private RouterFunction<ServerResponse> proxy(
            String routeId,
            String pathPattern,
            String prefix,
            String serviceName
    ) {

        return route(routeId)
                .route(path(pathPattern), request -> {

                    String newPath = request.path().replaceFirst(prefix, "");

                    String query = request.uri().getQuery();
                    String targetUrl = "http://" + serviceName + newPath;

                    if (query != null && !query.isBlank()) {
                        targetUrl += "?" + query;
                    }

                    HttpHeaders headers = new HttpHeaders();
                    headers.putAll(request.headers().asHttpHeaders());

                    HttpEntity<byte[]> entity = new HttpEntity<>(
                            request.body(byte[].class),
                            headers
                    );

                    ResponseEntity<byte[]> response = restTemplate.exchange(
                            targetUrl,
                            request.method(),
                            entity,
                            byte[].class
                    );

                    ServerResponse.BodyBuilder builder = ServerResponse
                            .status(response.getStatusCode())
                            .headers(h -> h.addAll(response.getHeaders()));

                    return response.getBody() == null
                            ? builder.build()
                            : builder.body(response.getBody());
                })
                .build();
    }

    @Bean
    public RouterFunction<ServerResponse> userServiceRoute() {
        return proxy("user_service", "/api/users/**", "/api/users", "USER-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> mediaServiceRoute() {
        return proxy("media_service", "/api/medias/**", "/api/medias", "MEDIA-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> followServiceRoute() {
        return proxy("follow_service", "/api/follows/**", "/api/follows", "FOLLOW-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> contentServiceRoute() {
        return proxy("content_service", "/api/contents/**", "/api/contents", "CONTENT-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> interactionServiceRoute() {
        return proxy("interaction_service", "/api/interactions/**", "/api/interactions", "INTERACTION-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> messageServiceRoute() {
        return proxy("message_service", "/api/messages/**", "/api/messages", "MESSAGE-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> notificationServiceRoute() {
        return proxy("notification_service", "/api/notifications/**", "/api/notifications", "NOTIFICATION-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> feedServiceRoute() {
        return proxy("feed_service", "/api/feeds/**", "/api/feeds", "FEED-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> adServiceRoute() {
        return proxy("ad_service", "/api/ads/**", "/api/ads", "AD-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> adServiceDocsRoute() {
        return proxy("ad_service_docs", "/ads-service/v3/api-docs", "/ads-service", "ADS-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> contentServiceDocsRoute() {
        return proxy("content_service_docs", "/content-service/v3/api-docs.json", "/content-service", "CONTENT-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> userServiceDocsRoute() {
        return proxy("user_service_docs", "/user-service/v3/api-docs", "/user-service", "USER-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> followServiceDocsRoute() {
        return proxy("follow_service_docs", "/follow-service/v3/api-docs", "/follow-service", "FOLLOW-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> mediaServiceDocsRoute() {
        return proxy("media_service_docs", "/media-service/v3/api-docs", "/media-service", "MEDIA-SERVICE");
    }

    @Bean
    public RouterFunction<ServerResponse> interactionServiceDocsRoute() {
        return proxy("interaction_service_docs", "/interaction-service/v3/api-docs.json", "/interaction-service", "INTERACTION-SERVICE");
    }
}
