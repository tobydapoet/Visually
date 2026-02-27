package com.example.service.entities;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "adMetric")
public class AdMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adId" , nullable = false)
    private Ad ad;

    @Column(nullable = false)
    private Long views = 0L;

    @Column(nullable = false)
    private Long clicks = 0L;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
