package com.example.service.responses;

import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.GenderOption;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class AdResponse{
    private Long id;

    private AdType contentType;

    private Integer ageMin;

    private Integer ageMax;

    private GenderOption gender;

    private BigDecimal dailyBudget;

    private BigDecimal spentAmount;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private Long views;

    private ContentResponse content;

    private AdStatus status;

    private LocalDateTime pausedAt;
}
