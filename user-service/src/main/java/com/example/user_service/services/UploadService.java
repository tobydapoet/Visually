package com.example.user_service.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.user_service.clients.MediaClient;
import com.example.user_service.exceptions.ConflictException;
import com.example.user_service.exceptions.SystemException;
import com.example.user_service.responses.MediaResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
public class UploadService {
    @Autowired
    MediaClient mediaClient;

    public MediaResponse upload(MultipartFile file, UUID userId, String roles) {

        List<MediaResponse> mediaFiles = mediaClient.upload(
                List.of(file),
                "account",
                userId.toString(),
                roles
        );

        if (mediaFiles == null || mediaFiles.isEmpty()) {
            throw new ConflictException("No file uploaded");
        }

        return mediaFiles.get(0);
    }

    public void delete(Long urlId, UUID userId, String roles) {
        mediaClient.delete(List.of(urlId), userId.toString(), roles);
    }
}
