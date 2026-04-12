package com.example.media_service.repositories;

import com.example.media_service.entities.MusicLibrary;
import com.example.media_service.enums.MusicStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MusicLibraryRepository extends JpaRepository<MusicLibrary, Long> {
    @Query("""
        SELECT m FROM MusicLibrary m
        WHERE (
            :status IS NULL OR m.status = :status
        )
        AND (
            :keyword IS NULL
            OR LOWER(m.title)  LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(m.artist) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
    """)
    Page<MusicLibrary> search(
            @Param("keyword") String keyword,
            @Param("status") MusicStatus status,
            Pageable pageable
    );
}
