package com.example.service.services;

import com.example.service.entities.AdUserProfile;
import com.example.service.exceptions.NotFoundException;
import com.example.service.repositories.AdUserProfileRepository;
import com.example.service.responses.UserProfileUpdatedEvent;
import com.example.service.responses.UserStatusUpdateEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.UUID;

@Service
public class AdUserProfileService {
    @Autowired
    AdUserProfileRepository adUserProfileRepository;

    public AdUserProfile findById(UUID id) throws NotFoundException {
        return adUserProfileRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public void handleUpdateStatus(UserStatusUpdateEvent event) {
        AdUserProfile user = this.findById(event.getId());
        user.setStatus(event.getStatus());
        adUserProfileRepository.save(user);
    }

    public void handleUpdateProfile(UserProfileUpdatedEvent event) {
        AdUserProfile user = this.findById(event.getId());
        user.setGender(event.getGender());
        if(event.getDob() != null) {
            int age = Period.between(event.getDob(), LocalDate.now()).getYears();
            user.setAge(age);
        }
        adUserProfileRepository.save(user);
    }

    public void handleCreateUser(UserProfileUpdatedEvent event) {
        AdUserProfile user = new AdUserProfile();
        user.setUserId(event.getId());
        user.setGender(event.getGender());
        if(event.getDob() != null) {
            int age = Period.between(event.getDob(), LocalDate.now()).getYears();
            user.setAge(age);
        }
        adUserProfileRepository.save(user);
    }
}
