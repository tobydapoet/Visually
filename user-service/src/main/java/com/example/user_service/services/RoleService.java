package com.example.user_service.services;

import com.example.user_service.entities.Role;
import com.example.user_service.repositories.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RoleService {
    @Autowired
    private RoleRepository roleRepository;

    public Role create (Role role) {
        return roleRepository.save(role);
    }
}
