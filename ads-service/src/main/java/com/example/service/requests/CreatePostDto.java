package com.example.service.requests;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreatePostDto {

    @NotBlank(message = "Caption must not be blank")
    private String caption;

    @NotNull(message = "Music ID is required")
    @Positive(message = "Music ID must be a positive number")
    private Integer musicId;

    @NotNull(message = "Tags list is required")
    private List<@NotBlank(message = "Each tag must not be blank") String> tagsName;

    @NotNull(message = "Collab user IDs list is required")
    @NotEmpty(message = "Collab user IDs list must not be empty")
    private List<UUID> collabUserId;
}