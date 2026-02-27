package com.example.media_service.repositories;

import com.example.media_service.entities.MusicLibrary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MusicLibraryRepository extends JpaRepository<MusicLibrary, Long> {
    @Query("""
        SELECT m FROM MusicLibrary m
        WHERE (
                LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(m.artist) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
        AND m.status = 'ACTIVE'
        """)
    Page<MusicLibrary> search(@Param("keyword") String keyword, Pageable pageable);
}
