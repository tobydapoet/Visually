package com.example.service.entities;

import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.GenderOption;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ads")
@Data
public class Ad {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "CHAR(36)")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID userId;

    @Column(nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "contentType", nullable = false)
    private AdType contentType;

    @Column(name = "contentId", nullable = false)
    private Long contentId;

    @Column(name = "ageMin", nullable = false)
    private Integer ageMin;

    @Column(name = "ageMax")
    private Integer ageMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GenderOption gender;

    @Column(name = "dailyBudget", nullable = false)
    private BigDecimal dailyBudget;

    @Column(name = "dailySpend", columnDefinition = "DECIMAL(19,2) DEFAULT 0")
    private BigDecimal dailySpend = BigDecimal.ZERO;

    @Column(name = "spentAmount", columnDefinition = "DECIMAL(19,2) DEFAULT 0")
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(name = "startDate", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "endDate", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "pausedAt")
    private LocalDateTime pausedAt;

    @Column(nullable = false)
    private Long views = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdStatus status = AdStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "createdAt")
    private LocalDateTime createdAt;

    @Column(name = "deletedAt")
    private LocalDateTime deletedAt;
}