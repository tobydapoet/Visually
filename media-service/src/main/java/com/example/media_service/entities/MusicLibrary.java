package com.example.media_service.entities;

import com.example.media_service.enums.MusicStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "music_library")
@Data
public class MusicLibrary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = true)
    private String artist;

    @Column(nullable = true)
    private String title;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private Double duration;

    @Column(nullable = true)
    private String img;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MusicStatus status =  MusicStatus.PENDING;
}
