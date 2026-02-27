package com.example.service.repositories;

import com.example.service.entities.Ad;
import com.example.service.entities.AdMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AdMetricRepository extends JpaRepository<AdMetric, Long> {
    @Query("""
            SELECT m from AdMetric m
            WHERE m.ad.id = :adId
            """)
    Optional<AdMetric> findByAdId(@Param("adId") Long adId);
}
