package com.example.service.repositories;

import com.example.service.entities.AdBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AdBudgetRepository extends JpaRepository<AdBudget, Long> {
    @Query("""
            SELECT b from AdBudget b
            WHERE b.ad.id = :adId
            """)
    Optional<AdBudget> findByAdId(@Param("adId") Long adId);
}
