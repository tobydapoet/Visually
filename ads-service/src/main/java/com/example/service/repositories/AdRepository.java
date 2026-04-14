package com.example.service.repositories;

import com.example.service.entities.Ad;
import com.example.service.enums.AdType;
import com.example.service.enums.GenderOption;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AdRepository extends JpaRepository<Ad,Long> {
    Page<Ad> findByUserId(UUID userId, Pageable pageable);

    @Query("""
        SELECT a FROM Ad a
        WHERE LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
        """)
    Page<Ad> search(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT a FROM Ad a
        WHERE (
            (:age IS NOT NULL AND :age BETWEEN ageMin AND ageMax)
            OR (:age IS NULL)
        )
        AND (gender = :all OR gender = :gender)
        AND type = :type
    """)
    List<Ad> findMatchingAds(
            @Param("age") Integer age,
            @Param("gender") GenderOption gender,
            @Param("all") GenderOption all,
            @Param("type") AdType type,
            Pageable pageable
    );
}
