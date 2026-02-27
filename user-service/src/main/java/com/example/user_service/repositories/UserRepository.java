package com.example.user_service.repositories;

import com.example.user_service.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    User findByEmail(String email);
    @Query("""
            SELECT u FROM User u
            WHERE LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<User> searchUser(String keyword, Pageable pageable);
}
