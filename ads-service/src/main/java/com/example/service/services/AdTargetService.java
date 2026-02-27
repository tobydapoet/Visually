package com.example.service.services;

import com.example.service.entities.AdTarget;
import com.example.service.repositories.AdTargetRepository;
import com.example.service.requests.CreateAdTargetDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdTargetService {
    @Autowired
    private AdTargetRepository adTargetRepository;

    public AdTarget create(CreateAdTargetDto createAdTarget) {
        AdTarget adTarget = new AdTarget();
        adTarget.setGender(createAdTarget.getGender());
        adTarget.setAgeMin(createAdTarget.getAgeMin());
        adTarget.setAgeMax(createAdTarget.getAgeMax());
        return adTargetRepository.save(adTarget);
    }
}
