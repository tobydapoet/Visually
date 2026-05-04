package com.example.media_service.controllers;

import com.example.media_service.contexts.AuthContext;
import com.example.media_service.entities.MusicLibrary;
import com.example.media_service.enums.MusicStatus;
import com.example.media_service.exceptions.UnauthorizedException;
import com.example.media_service.requests.CurrentUser;
import com.example.media_service.requests.MusicCreateRequest;
import com.example.media_service.requests.MusicUpdateRequest;
import com.example.media_service.services.MusicLibraryService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/music_library")
public class MusicLibraryController {
    @Autowired
    MusicLibraryService musicLibraryService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> create(@ModelAttribute MusicCreateRequest req) {
        CurrentUser currentUser = AuthContext.get();

        if (currentUser.getRole().equals("CLIENT")) {
            throw new UnauthorizedException("Only clients can perform this action");
        }

        MusicLibrary savedMusic = musicLibraryService.create(req);
        if (savedMusic != null) {
            return ResponseEntity.ok(Map.of(
                    "message", "Add music success"));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Add music failed"));
        }
    }

    @PutMapping(value = "/{id}/status")
    public ResponseEntity<Map<String, String>> updateStatus(
            @PathVariable Long id,
            @RequestParam MusicStatus status) {

        CurrentUser currentUser = AuthContext.get();

        if (currentUser.getRole().equals("CLIENT")) {
            throw new UnauthorizedException("Only clients can perform this action");
        }

        MusicLibrary updatedMusic = musicLibraryService.updateStatus(id, status);
        if (updatedMusic != null) {
            return ResponseEntity.ok(Map.of(
                    "message", "Update music success"));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Update music failed"));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> update(
            @PathVariable Long id,
            @ModelAttribute MusicUpdateRequest req) {
        CurrentUser currentUser = AuthContext.get();

        if (currentUser.getRole().equals("CLIENT")) {
            throw new UnauthorizedException("Only clients can perform this action");
        }

        MusicLibrary updatedMusic = musicLibraryService.update(id, req);
        if (updatedMusic != null) {
            return ResponseEntity.ok(Map.of(
                    "message", "Update music success"));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Update music failed"));
        }
    }

    @DeleteMapping(value = "/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {

        CurrentUser currentUser = AuthContext.get();

        if (currentUser.getRole().equals("CLIENT")) {
            throw new UnauthorizedException("Only clients can perform this action");
        }

        musicLibraryService.delete(id);
        return ResponseEntity.ok(Map.of(
                "message", "Delete music success"));
    }

    @GetMapping()
    public ResponseEntity<Page<MusicLibrary>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "ACTIVE") MusicStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<MusicLibrary> result = musicLibraryService.search(keyword, status, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MusicLibrary> get(@PathVariable Long id) {
        MusicLibrary result = musicLibraryService.findById(id);
        return ResponseEntity.ok(result);
    }
}
