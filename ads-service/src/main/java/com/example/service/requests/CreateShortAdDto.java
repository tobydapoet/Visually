package com.example.service.requests;

import com.example.service.enums.GenderOption;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.web.multipart.MultipartFile;

@Data
@EqualsAndHashCode(callSuper = false)
public class CreateShortAdDto extends CreateShortDto{
    @NotNull(message = "Budget is required")
    @Min(value = 1000, message = "Budget must be at least 1000")
    @Max(value = 100000000, message = "Budget must not exceed 100,000,000")
    private Long budget;

    @NotNull(message = "Time duration is required")
    @Min(value = 1, message = "Time must be at least 1 hour")
    @Max(value = 720, message = "Time must not exceed 720 hours (30 days)")
    private Integer time;

    @NotNull(message = "File are required")
    @NotEmpty(message = "At least one file must be provided")
    private MultipartFile file;

    @NotNull(message = "Minimum age is required")
    private Integer ageMin;

    @NotNull(message = "Maximum age is required")
    private Integer ageMax;

    @NotNull(message = "Gender option is required")
    private GenderOption gender;

    @AssertTrue(message = "Maximum age must be greater than or equal to minimum age")
    private boolean isAgeRangeValid() {
        if (ageMin == null || ageMax == null) {
            return true;
        }
        return ageMax >= ageMin;
    }
}
