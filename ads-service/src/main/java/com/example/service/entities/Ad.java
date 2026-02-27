package com.example.service.entities;

import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ads")
@Data
public class Ad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false,columnDefinition = "CHAR(36)")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID userId;

    @Column(nullable = false)
    private String snapshotUsername;

    @Column
    private String snapshotAvatarUrl;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AdType adType = AdType.POST;

    @Column(nullable = false)
    private Long adContentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "targetId", nullable = false)
    private AdTarget adTarget;

    @OneToOne(mappedBy = "ad",fetch = FetchType.LAZY)
    private AdBudget adBudget;

    @OneToOne(mappedBy = "ad",fetch = FetchType.LAZY)
    private AdMetric adMetric;

    @Column(nullable = false)
    private String snapshotUrl;

    @Column(nullable = false)
    private String snapshotCaption;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdStatus status = AdStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private LocalDateTime endAt;
}
