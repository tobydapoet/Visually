package com.example.service.requests;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.Length;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateShortDto {
    @Length(max = 2200, message = "Caption must not exceed 2200 characters")
    private String caption;

    @NotNull(message = "Media ID is required")
    @Positive(message = "Media ID must be a positive number")
    private Integer mediaId;

    @Positive(message = "Music ID must be a positive number")
    private Integer musicId;

    @NotNull(message = "Tags list is required")
    @Builder.Default
    private List<@NotBlank(message = "Tag name must not be blank")
    @Length(max = 50, message = "Tag name must not exceed 50 characters")
            String> tagsName = new ArrayList<>();

}