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

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AdType contentType;

    @Column(nullable = false)
    private Long contentId;

    @Column(nullable = false)
    private Integer ageMin;

    @Column
    private Integer ageMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GenderOption gender;

    @Column(nullable = false)
    private BigDecimal dailyBudget;

    @Column(columnDefinition = "DECIMAL(19,2) DEFAULT 0")
    private BigDecimal dailySpend = BigDecimal.ZERO;

    @Column(columnDefinition = "DECIMAL(19,2) DEFAULT 0")
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column
    private LocalDateTime pausedAt;

    @Column(nullable = false)
    private Long views = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdStatus status = AdStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime deletedAt;
}