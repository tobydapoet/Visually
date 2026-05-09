package com.example.user_service.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Data
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "expiredAt", nullable = false)
    private LocalDateTime expiredAt;

    @CreationTimestamp
    @Column(name = "createdAt")
    private LocalDateTime createdAt;
}
