package com.example.service.entities;

import com.example.service.enums.Gender;
import com.example.service.enums.GenderOption;
import com.example.service.enums.StatusType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ad_user_profile")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdUserProfile {
    @Id
    @Column(columnDefinition = "CHAR(36)",nullable = false, updatable = false)
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "age")
    private Integer age;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StatusType status =  StatusType.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

