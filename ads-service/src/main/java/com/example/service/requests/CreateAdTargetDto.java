package com.example.service.requests;

import com.example.service.enums.GenderOption;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdTargetDto {

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