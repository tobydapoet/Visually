package com.example.media_service.entities;

import com.example.media_service.enums.FileType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_files")
@Data
public class MediaFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType type;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime createdAt;
}