package com.example.media_service.controllers;

import com.example.media_service.entities.MediaFile;
import com.example.media_service.enums.FileType;
import com.example.media_service.services.MediaFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/media_file")
public class MediaFileController {
    @Autowired
    private MediaFileService mediaFileService;

    @GetMapping("/{id}")
    public MediaFile getOne(@PathVariable Long id)
    {
        return mediaFileService.findById(id);
    }

    @PostMapping("/many")
    public List<MediaFile> getMany(@RequestBody List<Long> ids) {
        return mediaFileService.findManyById(ids);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<MediaFile>> createMany(
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam("folder") String folder
    ) {
        try {
            List<MediaFile> result = mediaFileService.create(files, folder);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    @DeleteMapping
    public ResponseEntity<List<String>> deleteMany(
            @RequestBody List<Long> ids
    ) {
        List<String> urls = mediaFileService.delete(ids);
        return ResponseEntity.ok(urls);
    }
}
