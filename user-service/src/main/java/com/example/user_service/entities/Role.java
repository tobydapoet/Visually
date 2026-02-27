package com.example.user_service.entities;

import com.example.user_service.enums.RoleType;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Roles")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private RoleType name;

    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
}
