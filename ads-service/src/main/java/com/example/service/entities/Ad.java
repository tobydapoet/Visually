package com.example.service.entities;

import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.GenderOption;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
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
    private AdType type;

    @Column(nullable = false)
    private Long contentId;

    @Column(nullable = false)
    private Integer ageMin;

    @Column
    private Integer ageMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GenderOption gender;

    @Column
    private BigDecimal dailyBudget;

    @Column
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column
    private LocalDateTime startDate;

    @Column
    private LocalDateTime endDate;

    @Column(nullable = false)
    private Long views = 0L;

    @Column(nullable = false)
    private Long clicks = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdStatus status = AdStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime deletedAt;
}