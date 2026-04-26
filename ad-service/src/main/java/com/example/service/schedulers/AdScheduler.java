package com.example.service.schedulers;

import com.example.service.repositories.AdRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdScheduler {

    private final AdRepository adRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void resetDailySpent() {
        adRepository.resetAllSpentAmount();
    }
}