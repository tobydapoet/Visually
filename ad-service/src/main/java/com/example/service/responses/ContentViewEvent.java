package com.example.service.responses;

import lombok.Data;

import java.util.UUID;

@Data
public class ContentViewEvent {
    private Long contentId;
    private String contentType;
}

