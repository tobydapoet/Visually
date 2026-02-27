package com.example.media_service.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.media_service.enums.FileType;
import com.example.media_service.exceptions.ConflictException;
import com.example.media_service.exceptions.SystemException;
import com.example.media_service.responses.UploadResult;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

@Service
public class UploadService {
    @Autowired
    private Cloudinary cloudinary;

    public FileType detectFileType(MultipartFile file) {
        try {
            Tika tika = new Tika();
            String mimeType = tika.detect(file.getInputStream());

            if (mimeType == null || mimeType.isBlank()) {
                throw new ConflictException("Cannot detect mime type");
            }

            if (mimeType.startsWith("image/")) {
                return FileType.IMAGE;
            }

            if (mimeType.startsWith("video/")) {
                return FileType.VIDEO;
            }

            if (mimeType.startsWith("audio/")) {
                return FileType.AUDIO;
            }

            throw new ConflictException("Unsupported file type: " + mimeType);

        } catch (SystemException e) {
            throw e;
        } catch (Exception e) {
            throw new SystemException("Cannot detect file type", e);
        }
    }


    public UploadResult upload(MultipartFile file, String folder) {
        try {
            System.out.println("=== UPLOAD SERVICE - CLOUDINARY ===");

            FileType type = detectFileType(file);

            System.out.println("Detected FileType enum: " + type);
            System.out.println("Cloudinary resource_type: " + type.cloudinary());
            System.out.println("Folder: " + folder);

            byte[] fileBytes = file.getBytes();
            File tempFile = File.createTempFile("upload-", ".tmp");
            Files.write(tempFile.toPath(), fileBytes);

            Map uploadRes = cloudinary.uploader().upload(
                    tempFile,
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", type.cloudinary()
                    )
            );

            System.out.println("Cloudinary upload SUCCESS!");
            System.out.println("Cloudinary response: " + uploadRes);

            String url = uploadRes.get("secure_url").toString();

            Double duration = null;
            if (type == FileType.AUDIO || type == FileType.VIDEO) {
                Object dur = uploadRes.get("duration");
                if (dur != null) {
                    duration = ((Number) dur).doubleValue();
                }
            }

            return new UploadResult(url, type, duration);

        } catch (Exception e) {
            e.printStackTrace();
            throw new SystemException("Upload failed: " + e.getMessage(), e);
        }
    }



    public void delete(String url) {
        String[] parts = url.split("/upload/");
        if (parts.length < 2)
            throw new RuntimeException("Invalid Cloudinary URL");

        String path = parts[1];

        int firstSlash = path.indexOf("/");
        if (firstSlash != -1) {
            path = path.substring(firstSlash + 1);
        }

        int dotIndex = path.lastIndexOf(".");
        if (dotIndex != -1) {
            path = path.substring(0, dotIndex);
        }

        try {
            cloudinary.uploader().destroy(path, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new RuntimeException("Delete file error", e);
        }
    }

}
