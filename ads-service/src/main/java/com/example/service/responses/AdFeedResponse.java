package com.example.service.responses;

import com.example.service.entities.AdTarget;
import com.example.service.enums.AdType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdFeedResponse {
    private Long adContentId;

    private AdType adType;
}
