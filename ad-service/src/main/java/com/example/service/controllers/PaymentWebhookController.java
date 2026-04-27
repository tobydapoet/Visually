package com.example.service.controllers;

import com.example.service.entities.Ad;
import com.example.service.requests.CreateAdDto;
import com.example.service.requests.PendingAdData;
import com.example.service.requests.SepayWebhookDto;
import com.example.service.services.AdService;
import com.example.service.services.PendingAdService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
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

@Log4j2
@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PendingAdService pendingAdService;
    private final AdService adService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @PostMapping("/webhook/sepay")
    public ResponseEntity<?> handleSepayWebhook(@RequestBody SepayWebhookDto body) {
        log.debug("transferType: [{}]", body.getTransferType());
        log.debug("content: [{}]", body.getContent());

        if (!"in".equals(body.getTransferType())) {
            log.debug("SKIP: transferType not 'in'");
            return ResponseEntity.ok(Map.of("success", true));
        }

        Pattern pattern = Pattern.compile("USER (\\d+) PAY FOR BOOSTED POST");
        Matcher matcher = pattern.matcher(body.getContent());

        if (!matcher.find()) {
            log.debug("SKIP: pattern not matched");
            return ResponseEntity.ok(Map.of("success", true));
        }

        String userId = matcher.group(1);
        log.debug("userId: [{}]", userId);

        PendingAdData dto = pendingAdService.get(UUID.fromString(userId));
        log.debug("pendingData: [{}]", dto);

        if (dto == null) {
            log.debug("SKIP: no pending ad in Redis");
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
