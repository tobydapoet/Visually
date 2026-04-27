package com.example.service.controllers;

import com.example.service.entities.Ad;
import com.example.service.requests.CreateAdDto;
import com.example.service.requests.PendingAdData;
import com.example.service.requests.SepayWebhookDto;
import com.example.service.services.AdService;
import com.example.service.services.PendingAdService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PendingAdService pendingAdService;
    private final AdService adService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @PostMapping("/webhook/sepay")
    public ResponseEntity<?> handleSepayWebhook(@RequestBody SepayWebhookDto body) {
        if (!"in".equals(body.getTransferType())) {
            return ResponseEntity.ok(Map.of("success", true));
        }

        Pattern pattern = Pattern.compile("USER (\\d+) PAY FOR BOOSTED POST");
        Matcher matcher = pattern.matcher(body.getContent());

        if (!matcher.find()) {
            return ResponseEntity.ok(Map.of("success", true));
        }

        String userId   = matcher.group(1);

        PendingAdData dto = pendingAdService.get(UUID.fromString(userId));

        if (dto == null) {
            kafkaTemplate.send("ad.registered.result", Map.of(
                    "userId", userId,
                    "success", false
            ));
            return ResponseEntity.ok(Map.of("success", true));
        }

        try {
            Ad ad = adService.createAd(dto, UUID.fromString(userId));
            pendingAdService.delete(UUID.fromString(userId));

            kafkaTemplate.send("ad.registered.result", Map.of(
                    "userId", userId,
                    "success", ad != null
            ));
        } catch (Exception e) {
            kafkaTemplate.send("ad.registered.result", Map.of(
                    "userId", userId,
                    "success", false
            ));
        }


        return ResponseEntity.ok(Map.of("success", true));
    }
}
