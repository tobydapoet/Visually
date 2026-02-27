package com.example.service.repositories;

import com.example.service.entities.AdUserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdUserProfileRepository extends JpaRepository<AdUserProfile, UUID> {
}
