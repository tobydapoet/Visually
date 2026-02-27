package com.example.media_service.services;

import com.example.media_service.entities.MediaFile;
import com.example.media_service.enums.FileType;
import com.example.media_service.exceptions.ConflictException;
import com.example.media_service.exceptions.SystemException;
import com.example.media_service.repositories.MediaFileRepository;
import com.example.media_service.responses.UploadResult;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MediaFileService {
    @Autowired
    private MediaFileRepository mediaFileRepository;

    @Autowired
    private UploadService uploadService;

    @Transactional
    public List<MediaFile> create(
            List<MultipartFile> files,
            String folder
    ) {
        System.out.println("=== MEDIA FILE SERVICE CREATE ===");
        System.out.println("Files count: " + (files != null ? files.size() : "null"));
        System.out.println("Folder: " + folder);

        List<MediaFile> savedFiles = new ArrayList<>();
        List<String> uploadedUrls = new ArrayList<>();

        try {
            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);

                System.out.println("=== Processing file " + (i + 1) + " ===");
                System.out.println("Filename: " + file.getOriginalFilename());
                System.out.println("Size: " + file.getSize());
                System.out.println("Content-Type: " + file.getContentType());

                UploadResult uploadRes = uploadService.upload(file,  folder);

                System.out.println("Upload result: " + uploadRes);

                String url = uploadRes.getUrl();
                uploadedUrls.add(url);

                MediaFile media = new MediaFile();
                media.setUrl(url);
                media.setType(uploadRes.getType());

                savedFiles.add(mediaFileRepository.save(media));

                System.out.println("Saved to DB: " + media);
            }

            System.out.println("=== SUCCESS - Total saved: " + savedFiles.size() + " ===");
            return savedFiles;

        } catch (Exception e) {
            System.err.println("=== ERROR IN CREATE ===");
            System.err.println("Exception: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();

            System.out.println("Rolling back uploads: " + uploadedUrls.size() + " files");
            uploadedUrls.forEach(url -> {
                try {
                    uploadService.delete(url);
                    System.out.println("Deleted: " + url);
                } catch (Exception ex) {
                    System.err.println("Failed to delete: " + url);
                }
            });

            throw new SystemException("Failed to create media files: " + e.getMessage(), e);
        }
    }

    @Transactional
    public List<String> delete(List<Long> ids) {
        List<MediaFile> files = mediaFileRepository.findAllById(ids);

        if (files.size() != ids.size()) {
            throw new ConflictException("Some files not found");
        }

        List<String> urls = files.stream()
                .map(MediaFile::getUrl)
                .toList();

        mediaFileRepository.deleteAll(files);

        return urls;
    }


    public MediaFile findById(Long id) {
        return mediaFileRepository.findById(id)
                .orElseThrow(() ->
                        new ConflictException("Can't find this file in system"));
    }

    public List<MediaFile> findManyById(List<Long> ids) {
        List<MediaFile> files = mediaFileRepository.findAllById(ids);

        if(files.size() != ids.size()) {
            throw new ConflictException("Some media files not found");
        }

        return files;
    }
}
