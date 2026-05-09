package com.example.user_service.entities;

import com.example.user_service.enums.Gender;
import com.example.user_service.enums.RoleType;
import com.example.user_service.enums.StatusType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", columnDefinition = "CHAR(36)")
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false,  unique = true)
    private String username;

    @Column(name= "fullName",nullable = false)
    private String fullName;

    @Column(name= "avatarUrl")
    private String avatarUrl;

    @Column(name="avatarId")
    private Long avatarId;

    @Column()
    private LocalDate dob;

    @Column(name="lastSeen")
    private LocalDateTime lastSeen = null;

    @Column(unique = true)
    private String phone;

    @Column
    @Enumerated(EnumType.STRING)
    private StatusType status = StatusType.ACTIVE;

    @Column(name="providerId",unique = true, nullable = true)
    private String providerId;

    @Column(nullable = true)
    private String bio;

    @Column(nullable = false)
    private Long followers = 0L;

    @Column(nullable = false)
    private Long following = 0L;

    @Column(name="bannedUntil")
    private LocalDate bannedUntil = null;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(name="createdAt")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name="updatedAt")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "user")
    private List<Session> sessions = new ArrayList<>();

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RoleType role =  RoleType.CLIENT;
}
