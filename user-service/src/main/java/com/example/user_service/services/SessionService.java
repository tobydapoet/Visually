package com.example.user_service.services;

import com.example.user_service.entities.Session;
import com.example.user_service.repositories.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SessionService {
    @Autowired
    private SessionRepository sessionRepository;

    public Session create(Session session) {
        return sessionRepository.save(session);
    }

    public Session findByToken(String token) {
        return sessionRepository.findByToken(token);
    }

    public void delete(Long id) { sessionRepository.deleteById(id); }
}
