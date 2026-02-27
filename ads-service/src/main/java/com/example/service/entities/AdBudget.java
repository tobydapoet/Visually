package com.example.service.entities;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "AdBudget")
public class AdBudget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adId" , nullable = false)
    private Ad ad;

    @Column(nullable = false)
    private Long budget = 0L;

    @Column(nullable = false)
    private Long spentValue = 0L;
}
