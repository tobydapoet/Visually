package com.example.service.requests;

import com.example.service.enums.AdType;
import com.example.service.enums.GenderOption;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = false)
public class CreateAdDto {
    @NotNull(message = "Budget is required")
    @Min(value = 1000, message = "Budget must be at least 1000")
    @Max(value = 1000000, message = "Budget must not exceed 100,000,000")
    private BigDecimal dailyBudget;

    @NotNull(message = "Time duration is required")
    @Min(value = 1, message = "Time must be at least 1 hour")
    @Max(value = 720, message = "Time must not exceed 720 hours (30 days)")
    private Integer time;

    @NotNull(message = "Minimum age is required")
    private Integer ageMin;

    @NotNull(message = "Maximum age is required")
    private Integer ageMax;

    @NotNull(message = "Gender option is required")
    private GenderOption gender;

    @NotNull(message = "Ad type is required")
    @Enumerated(EnumType.STRING)
    private AdType contentType;

    @NotNull(message = "content id is required")
    private Long contentId;

    @AssertTrue(message = "Maximum age must be greater than or equal to minimum age")
    private boolean isAgeRangeValid() {
        if (ageMin == null || ageMax == null) return true;
        return ageMax >= ageMin;
    }
}