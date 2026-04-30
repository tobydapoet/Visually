package com.example.service.repositories;

import com.example.service.entities.Ad;
import com.example.service.enums.AdType;
import com.example.service.enums.GenderOption;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdRepository extends JpaRepository<Ad,Long> {
    Page<Ad> findByUserId(UUID userId, Pageable pageable);

    @Query("""
    SELECT a FROM Ad a
    WHERE (:keyword IS NULL OR :keyword = '' 
           OR LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%')))
       """)
    Page<Ad> search(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT a FROM Ad a
        WHERE (
            (:age IS NOT NULL AND :age BETWEEN ageMin AND ageMax)
            OR (:age IS NULL)
        )
        AND (gender = :all OR gender = :gender)
        AND contentType = :type
    """)
    List<Ad> findMatchingAds(
            @Param("age") Integer age,
            @Param("gender") GenderOption gender,
            @Param("all") GenderOption all,
            @Param("type") AdType type,
            Pageable pageable
    );


    @Query("""
    SELECT a FROM Ad a
    WHERE 
        a.status = com.example.service.enums.AdStatus.ACTIVE
        AND a.deletedAt IS NULL
        AND a.startDate <= CURRENT_TIMESTAMP
        AND a.endDate >= CURRENT_TIMESTAMP
        AND a.dailySpend < a.dailyBudget

        AND (
            :age IS NULL OR 
            (a.ageMin <= :age AND (a.ageMax IS NULL OR a.ageMax >= :age))
        )

        AND (
            a.gender = com.example.service.enums.GenderOption.ALL OR
            (:genderOption IS NULL OR a.gender = :genderOption)
        )

    ORDER BY a.dailyBudget DESC
    """)
    Page<Ad> findEligibleAds(@Param("genderOption") GenderOption genderOption,
                             @Param("age") Integer age,
                             Pageable pageable);

    Optional<Ad> findByContentIdAndContentType(Long contentId, AdType contentType);

    @Query("""
        SELECT a.userId FROM Ad a
        WHERE a.deletedAt IS NULL
        AND (:username IS NULL OR LOWER(a.userName) LIKE LOWER(CONCAT('%', :username, '%')))
        AND a.createdAt = (
            SELECT MAX(a2.createdAt) FROM Ad a2
            WHERE a2.userId = a.userId
            AND a2.deletedAt IS NULL
        )
        ORDER BY a.createdAt DESC
    """)
    Page<UUID> findDistinctUserIds(
            @Param("username") String username,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE Ad a SET a.spentAmount = 0")
    void resetAllSpentAmount();
}
