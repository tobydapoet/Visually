package com.example.service.responses;

import com.example.service.enums.AdType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdFeedResponse {
    private Long contentId;

    private AdType contentType;
}
