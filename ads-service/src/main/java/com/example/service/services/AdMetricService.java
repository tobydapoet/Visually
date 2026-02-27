package com.example.service.services;

import com.example.service.entities.AdMetric;
import com.example.service.exceptions.NotFoundException;
import com.example.service.repositories.AdMetricRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdMetricService {
    @Autowired
    private AdMetricRepository adMetricRepository;

    @Autowired
    private AdService adService;

    @Autowired
    private AdBudgetService adBudgetService;

    public void updateClick(Long adId) {
        AdMetric adMetric = adMetricRepository.findByAdId(adId)
                .orElseThrow(() -> new NotFoundException("Can't find this ad"));
        adMetric.setClicks(adMetric.getClicks() + 1);
        adBudgetService.updateSpend(adId);
    }

    public void updateView(Long adId) {
        AdMetric adMetric = adMetricRepository.findByAdId(adId)
                .orElseThrow(() -> new NotFoundException("Can't find this ad"));
        adMetric.setViews(adMetric.getViews() + 1);
    }
}
