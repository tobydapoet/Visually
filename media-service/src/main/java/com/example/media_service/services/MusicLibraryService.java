package com.example.media_service.services;

import com.example.media_service.contexts.AuthContext;
import com.example.media_service.entities.MusicLibrary;
import com.example.media_service.enums.MusicStatus;
import com.example.media_service.exceptions.ConflictException;
import com.example.media_service.repositories.MusicLibraryRepository;
import com.example.media_service.requests.CurrentUser;
import com.example.media_service.requests.MusicCreateRequest;
import com.example.media_service.requests.MusicUpdateRequest;
import com.example.media_service.responses.UploadResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class MusicLibraryService {
    @Autowired
    MusicLibraryRepository musicLibraryRepository;

    @Autowired
    UploadService uploadService;


    public MusicLibrary create(MusicCreateRequest req) {
        MusicLibrary musicLibrary = new MusicLibrary();
        musicLibrary.setArtist(req.getArtist());
        musicLibrary.setTitle(req.getTitle());
        musicLibrary.setStatus(MusicStatus.PENDING);
        UploadResult audioRes = uploadService.upload(req.getUrl(), "music");
        UploadResult imageRes = uploadService.upload(req.getImg(), "music_img");
        musicLibrary.setUrl((String) audioRes.getUrl());
        musicLibrary.setImg((String) imageRes.getUrl());
        musicLibrary.setDuration((Double) audioRes.getDuration());
        return musicLibraryRepository.save(musicLibrary);
    }

    public MusicLibrary updateStatus(Long id, MusicStatus status) {
        MusicLibrary musicLibrary = musicLibraryRepository.findById(id)
                .orElseThrow(() ->
                        new ConflictException("can't find this music in system"));
        musicLibrary.setStatus(status);
        return musicLibraryRepository.save(musicLibrary);
    }

    public MusicLibrary update(Long id, MusicUpdateRequest req) {
        MusicLibrary musicLibrary = musicLibraryRepository.findById(id)
                .orElseThrow(() ->
                        new ConflictException("can't find this music in system"));

        if (req.getArtist() != null) {
            musicLibrary.setArtist(req.getArtist());
        }

        if (req.getTitle() != null) {
            musicLibrary.setTitle(req.getTitle());
        }

        if(req.getUrl() != null) {
            UploadResult audioRes = uploadService.upload(req.getUrl(), "music");
            musicLibrary.setUrl(audioRes.getUrl());
            musicLibrary.setDuration(audioRes.getDuration());
        }

        if(req.getImg() != null) {
            UploadResult imageRes = uploadService.upload(req.getUrl(), "music_img");
            musicLibrary.setUrl((String) imageRes.getUrl());
        }

        return musicLibraryRepository.save(musicLibrary);
    }

    public boolean delete(Long id) {
        MusicLibrary musicLibrary = musicLibraryRepository.findById(id)
                .orElseThrow(() ->
                        new ConflictException("can't find this music in system"));
//        uploadService.delete(musicLibrary.getUrl());
//        uploadService.delete(musicLibrary.getImg());
        musicLibrary.setStatus(MusicStatus.DELETED);
        musicLibraryRepository.save(musicLibrary);
        return true;
    }

    public Page<MusicLibrary> search(String keyword, MusicStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        CurrentUser currentUser = AuthContext.get();

        boolean isClient = currentUser.getRole().equals("CLIENT");

        if (isClient && status != null && status != MusicStatus.ACTIVE) {
            throw new ConflictException("CLIENT only can view ACTIVE music");
        }

        MusicStatus finalStatus = isClient ? MusicStatus.ACTIVE : status;

        return musicLibraryRepository.search(kw, finalStatus, pageable);
    }

    public MusicLibrary findById(Long id) {
        MusicLibrary music = musicLibraryRepository.findById(id)
                .orElseThrow(() -> new ConflictException("can't find this music in system"));

        CurrentUser currentUser = AuthContext.get();


        if (currentUser.getRole().equals("CLIENT") && music.getStatus() != MusicStatus.ACTIVE) {
            throw new ConflictException("can't find this music in system");
        }

        return music;
    }
}
