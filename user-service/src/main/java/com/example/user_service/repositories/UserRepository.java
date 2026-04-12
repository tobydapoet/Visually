package com.example.user_service.repositories;

import com.example.user_service.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    User findByEmail(String email);
    @Query("""
    SELECT u FROM User u
    WHERE 
        (
            LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
        AND (
            :currentUserId IS NULL OR u.id <> :currentUserId
        )
    """)
    Page<User> searchUser(
            String keyword,
            UUID currentUserId,
            Pageable pageable
    );

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    boolean existsByUsername(String username);
}
