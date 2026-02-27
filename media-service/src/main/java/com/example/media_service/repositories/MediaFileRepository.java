package com.example.media_service.repositories;

import com.example.media_service.entities.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {

}
