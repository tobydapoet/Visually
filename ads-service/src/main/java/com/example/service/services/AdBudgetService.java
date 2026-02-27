package com.example.service.services;

import com.example.service.entities.Ad;
import com.example.service.entities.AdBudget;
import com.example.service.enums.AdStatus;
import com.example.service.exceptions.NotFoundException;
import com.example.service.repositories.AdBudgetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdBudgetService {
    @Autowired
    private AdBudgetRepository adBudgetRepository;

    @Autowired
    @Lazy
    private AdService adService;

    public AdBudget save(Ad ad, Long budget) {
        AdBudget adBudget = new AdBudget();
        adBudget.setBudget(budget);
        adBudget.setAd(ad);
        return adBudgetRepository.save(adBudget);
    }

    @Transactional
    public void updateSpend(Long adId) {
        AdBudget adBudget = adBudgetRepository.findByAdId(adId)
                .orElseThrow(() -> new NotFoundException("Can't find budget"));

        long newSpent = adBudget.getSpentValue() + 1000;
        adBudget.setSpentValue(newSpent);

        if(newSpent >= adBudget.getBudget()) {
            adService.updateStatus(adId, AdStatus.DISABLED);
        }

        adBudgetRepository.save(adBudget);
    }
}
