package com.example.media_service.responses;

import com.example.media_service.enums.FileType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UploadResult {
        private String url;
        private FileType type;
        private Double duration;
}
