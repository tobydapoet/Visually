package com.example.user_service.repositories;

import com.example.user_service.entities.Session;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionRepository extends JpaRepository<Session, Long> {
    Session findByToken(String token);
}

