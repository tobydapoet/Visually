package com.example.service.services;

import com.example.service.clients.ContentClient;
import com.example.service.contexts.AuthContext;
import com.example.service.entities.Ad;
import com.example.service.entities.AdUserProfile;
import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.Gender;
import com.example.service.enums.GenderOption;
import com.example.service.exceptions.NotFoundException;
import com.example.service.repositories.AdRepository;
import com.example.service.requests.*;
import com.example.service.responses.AdResponse;
import com.example.service.responses.ContentResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdService {
    @Autowired
    private AdRepository adRepository;

    @Autowired
    private ContentClient contentClient;

    @Autowired
    private AdUserProfileService adUserProfileService;

    private GenderOption mapToGenderOption(Gender gender) {
        if (gender == null) return null;

        return switch (gender) {
            case MALE -> GenderOption.MALE;
            case FEMALE -> GenderOption.FEMALE;
            case OTHER -> GenderOption.OTHER;
        };
    }

    public List<Ad> getAdsForFeed(UUID userId, int feedSize, AdType adType) {

        AdUserProfile profile = adUserProfileService.findById(userId);

        int numberOfAds = feedSize / 5;

        return adRepository.findMatchingAds(
                profile.getAge(),
                mapToGenderOption(profile.getGender()),
                GenderOption.ALL,
                adType,
                PageRequest.of(0, numberOfAds)
        );
    }

    public void updateStatus(Long id , AdStatus adStatus) {
        Ad ad = findById(id);
        ad.setStatus(adStatus);
        adRepository.save(ad);
    }

    public Ad createAd(CreateAdDto dto) {
        CurrentUser currentUser = AuthContext.get();

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime endDate = now.plusHours(dto.getTime());

        Ad ad = new Ad();
        ad.setGender(dto.getGender());
        ad.setAgeMin(dto.getAgeMin());
        ad.setAgeMax(dto.getAgeMax());
        ad.setAgeMax(dto.getAgeMax());
        ad.setAgeMin(dto.getAgeMin());
        ad.setDailyBudget(dto.getDailyBudget());
        ad.setUserId(currentUser.getUserId());
        ad.setType(dto.getType());
        ad.setContentId(dto.getContentId());
        ad.setStartDate(LocalDateTime.now());
        ad.setEndDate(LocalDateTime.now().plusHours(dto.getTime()));
        ad.setUsername(currentUser.getUsername());

        return adRepository.save(ad);
    }

    public Page<AdResponse> findByUserIdWithContent(UUID userId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Ad> ads = adRepository.findByUserId(userId, pageable);

        if (ads.isEmpty()) return Page.empty(pageable);

        List<Long> postIds = ads.stream()
                .filter(a -> a.getType() == AdType.POST)
                .map(Ad::getContentId)
                .toList();

        List<Long> shortIds = ads.stream()
                .filter(a -> a.getType() == AdType.SHORT)
                .map(Ad::getContentId)
                .toList();

        Map<Long, ContentResponse> contentMap = new HashMap<>();

        if (!postIds.isEmpty()) {
            contentClient.getPostsByIds(postIds)
                    .forEach(c -> contentMap.put(c.getId(), c));
        }

        if (!shortIds.isEmpty()) {
            contentClient.getShortsByIds(shortIds)
                    .forEach(c -> contentMap.put(c.getId(), c));
        }
        return ads.map(ad -> AdResponse.builder()
                .id(ad.getId())
                .type(ad.getType())
                .ageMin(ad.getAgeMin())
                .ageMax(ad.getAgeMax())
                .gender(ad.getGender())
                .dailyBudget(ad.getDailyBudget())
                .spentAmount(ad.getSpentAmount())
                .startDate(ad.getStartDate())
                .endDate(ad.getEndDate())
                .views(ad.getViews())
                .clicks(ad.getClicks())
                .content(contentMap.get(ad.getContentId()))
                .build()
        );
    }

    public Page<Ad> FindByPage(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return adRepository.findAll(pageable);
    }

    public Ad findById(Long id) {
        return adRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ad not found with id: " + id));
    }

    public AdResponse findContentById(Long id, UUID userId) {
        Ad ad = findById(id);
        ContentResponse contentResponse = contentClient.getContent(ad.getContentId(), ad.getType(), userId);
        AdResponse adResponse = new AdResponse();
        adResponse.setContent(contentResponse);
        adResponse.setId(ad.getId());
        adResponse.setType(ad.getType());
        adResponse.setStartDate(ad.getStartDate());
        adResponse.setEndDate(ad.getEndDate());
        adResponse.setDailyBudget(ad.getDailyBudget());
        adResponse.setGender(ad.getGender());
        adResponse.setViews(ad.getViews());
        adResponse.setClicks(ad.getClicks());
        adResponse.setSpentAmount(ad.getSpentAmount());
        adResponse.setAgeMax(ad.getAgeMax());
        adResponse.setAgeMin(ad.getAgeMin());
        return adResponse;
    }


    public Page<AdResponse> search(String keyword, Integer page, Integer size, UUID userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Ad> ads = adRepository.search(keyword, pageable);

        if (ads.isEmpty()) return Page.empty(pageable);

        List<Long> postIds = ads.stream()
                .filter(a -> a.getType() == AdType.POST)
                .map(Ad::getContentId)
                .toList();

        List<Long> shortIds = ads.stream()
                .filter(a -> a.getType() == AdType.SHORT)
                .map(Ad::getContentId)
                .toList();

        Map<Long, ContentResponse> contentMap = new HashMap<>();

        if (!postIds.isEmpty()) {
            contentClient.getPostsByIds(postIds)
                    .forEach(c -> contentMap.put(c.getId(), c));
        }

        if (!shortIds.isEmpty()) {
            contentClient.getShortsByIds(shortIds)
                    .forEach(c -> contentMap.put(c.getId(), c));
        }

        return ads.map(ad -> AdResponse.builder()
                .id(ad.getId())
                .type(ad.getType())
                .ageMin(ad.getAgeMin())
                .ageMax(ad.getAgeMax())
                .gender(ad.getGender())
                .dailyBudget(ad.getDailyBudget())
                .spentAmount(ad.getSpentAmount())
                .startDate(ad.getStartDate())
                .endDate(ad.getEndDate())
                .views(ad.getViews())
                .clicks(ad.getClicks())
                .content(contentMap.get(ad.getContentId()))
                .build()
        );
    }

    public void AdClick (Long id) {
        Ad ad = findById(id);
        ad.setClicks(ad.getClicks() + 1);
        adRepository.save(ad);
    }

    public void AdView (Long id) {
        Ad ad = findById(id);
        ad.setViews(ad.getViews() + 1);
        adRepository.save(ad);
    }
}
