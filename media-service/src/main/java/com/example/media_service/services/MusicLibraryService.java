package com.example.media_service.services;

import com.example.media_service.entities.MusicLibrary;
import com.example.media_service.enums.FileType;
import com.example.media_service.enums.MusicStatus;
import com.example.media_service.exceptions.ConflictException;
import com.example.media_service.repositories.MusicLibraryRepository;
import com.example.media_service.requests.MusicCreateRequest;
import com.example.media_service.requests.MusicUpdateRequest;
import com.example.media_service.responses.UploadResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Map;

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

    public Page<MusicLibrary> search(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return musicLibraryRepository.search(keyword, pageable);
    }

    public MusicLibrary findById(Long id) {
        return musicLibraryRepository.findById(id)
                .orElseThrow(() ->
                        new ConflictException("can't find this music in system"));
    }
}
