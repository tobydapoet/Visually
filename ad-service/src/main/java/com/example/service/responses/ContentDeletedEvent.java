package com.example.service.responses;

import com.example.service.enums.AdType;
import lombok.Data;

@Data
public class ContentDeletedEvent {
    private Long contentId;
    private AdType contentType;
    private String timestamp;
}