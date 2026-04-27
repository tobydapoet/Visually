package com.example.service.services;

import com.example.service.clients.ContentClient;
import com.example.service.clients.UserClient;
import com.example.service.entities.Ad;
import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.Gender;
import com.example.service.enums.GenderOption;

import com.example.service.exceptions.NotFoundException;
import com.example.service.repositories.AdRepository;
import com.example.service.requests.CreateAdDto;
import com.example.service.responses.AdResponse;
import com.example.service.responses.ContentDeletedEvent;
import com.example.service.responses.ContentResponse;
import com.example.service.responses.ContentViewEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AdService {
    @Autowired
    private AdRepository adRepository;

    @Autowired
    private ContentClient contentClient;

    @Autowired
    private UserClient userClient;


    public void handleContentDeleted(ContentDeletedEvent event) {
        Optional<Ad> adOptional = adRepository.findByContentIdAndContentType(
                event.getContentId(),
                event.getContentType()
        );

        if (adOptional.isEmpty()) {
            return;
        }

        Ad ad = adOptional.get();
        ad.setStatus(AdStatus.DISABLED);
        ad.setEndDate(LocalDateTime.now());
        adRepository.save(ad);
    }

    public void updateStatus(Long id, AdStatus newStatus) {
        Ad ad = findById(id);
        LocalDateTime now = LocalDateTime.now();

        AdStatus oldStatus = ad.getStatus();

        if (newStatus == AdStatus.INACTIVE) {
            if (oldStatus == AdStatus.ACTIVE) {
                ad.setPausedAt(now);
            }
        }

        else if (newStatus == AdStatus.ACTIVE) {
            if (oldStatus == AdStatus.INACTIVE && ad.getPausedAt() != null) {

                long pausedSeconds = java.time.Duration
                        .between(ad.getPausedAt(), now)
                        .getSeconds();

                ad.setEndDate(ad.getEndDate().plusSeconds(pausedSeconds));

                ad.setPausedAt(null);
            }

            if (oldStatus == AdStatus.DISABLED) {
                ad.setStartDate(now);
                ad.setEndDate(now.plusHours(24));
                ad.setPausedAt(null);
            }
        }

        else if (newStatus == AdStatus.DISABLED) {
            ad.setPausedAt(null);
        }

        ad.setStatus(newStatus);
        adRepository.save(ad);
    }

    public List<Ad> getAdByGenderAndAge(Gender gender, Integer age) {
        GenderOption genderOption = switch (gender) {
            case MALE -> GenderOption.MALE;
            case FEMALE -> GenderOption.FEMALE;
            default -> null;
        };

        PageRequest page = PageRequest.of(0, 10);
        List<Ad> ads = adRepository.findEligibleAds(genderOption, age, page).getContent();

        if (ads.isEmpty()) {
            return Collections.emptyList();
        }

        Collections.shuffle(ads);
        return ads;
    }

    public Ad createAd(CreateAdDto dto , UUID userId) {
        LocalDateTime now = LocalDateTime.now();

        Optional<Ad> optionalExisting = adRepository.findByContentIdAndContentType(
                dto.getContentId(), dto.getContentType()
        );

        if (optionalExisting.isPresent()) {
            Ad existing = optionalExisting.get();

            if (existing.getStatus() == AdStatus.DISABLED) {
                throw new RuntimeException("Ad is disabled, cannot update");
            }

            if (existing.getEndDate().isAfter(now)) {
                existing.setEndDate(existing.getEndDate().plusHours(dto.getTime()));
                existing.setDailyBudget(
                        existing.getDailyBudget().add(dto.getDailyBudget())
                );
            } else {
                existing.setStartDate(now);
                existing.setEndDate(now.plusHours(dto.getTime()));
                existing.setDailyBudget(dto.getDailyBudget());
                existing.setSpentAmount(BigDecimal.ZERO);
                existing.setStatus(AdStatus.ACTIVE);
            }

            existing.setGender(dto.getGender());
            existing.setAgeMin(dto.getAgeMin());
            existing.setAgeMax(dto.getAgeMax());

            return adRepository.save(existing);
        }

        String username = userClient.getUser(userId).getUsername();

        Ad ad = new Ad();
        ad.setUserId(userId);
        ad.setUsername(username);
        ad.setContentType(dto.getContentType());
        ad.setContentId(dto.getContentId());

        ad.setGender(dto.getGender());
        ad.setAgeMin(dto.getAgeMin());
        ad.setAgeMax(dto.getAgeMax());

        ad.setDailyBudget(dto.getDailyBudget());
        ad.setSpentAmount(BigDecimal.ZERO);
        ad.setDailySpend(BigDecimal.ZERO);

        ad.setStartDate(now);
        ad.setEndDate(now.plusHours(dto.getTime()));

        ad.setStatus(AdStatus.ACTIVE);

        return adRepository.save(ad);
    }

    public Page<AdResponse> findByUserIdWithContent(UUID userId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Ad> ads = adRepository.findByUserId(userId, pageable);

        if (ads.isEmpty()) return Page.empty(pageable);

        List<Long> postIds = ads.stream()
                .filter(a -> a.getContentType() == AdType.POST)
                .map(Ad::getContentId)
                .toList();

        List<Long> shortIds = ads.stream()
                .filter(a -> a.getContentType() == AdType.SHORT)
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
                .contentType(ad.getContentType())
                .ageMin(ad.getAgeMin())
                .ageMax(ad.getAgeMax())
                .gender(ad.getGender())
                .dailyBudget(ad.getDailyBudget())
                .spentAmount(ad.getSpentAmount())
                .startDate(ad.getStartDate())
                .endDate(ad.getEndDate())
                .views(ad.getViews())
                .pausedAt(ad.getPausedAt())
                .status(ad.getStatus())
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
        ContentResponse contentResponse = contentClient.getContent(ad.getContentId(), ad.getContentType(), userId);
        AdResponse adResponse = new AdResponse();
        adResponse.setContent(contentResponse);
        adResponse.setId(ad.getId());
        adResponse.setContentType(ad.getContentType());
        adResponse.setStartDate(ad.getStartDate());
        adResponse.setEndDate(ad.getEndDate());
        adResponse.setDailyBudget(ad.getDailyBudget());
        adResponse.setGender(ad.getGender());
        adResponse.setViews(ad.getViews());
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
                .filter(a -> a.getContentType() == AdType.POST)
                .map(Ad::getContentId)
                .toList();

        List<Long> shortIds = ads.stream()
                .filter(a -> a.getContentType() == AdType.SHORT)
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
                .contentType(ad.getContentType())
                .ageMin(ad.getAgeMin())
                .ageMax(ad.getAgeMax())
                .gender(ad.getGender())
                .dailyBudget(ad.getDailyBudget())
                .spentAmount(ad.getSpentAmount())
                .startDate(ad.getStartDate())
                .endDate(ad.getEndDate())
                .views(ad.getViews())
                .status(ad.getStatus())
                .pausedAt(ad.getPausedAt())
                .content(contentMap.get(ad.getContentId()))
                .build()
        );
    }


    public void AdView (ContentViewEvent event) {
        Optional<Ad> adOptional = adRepository.findByContentIdAndContentType(
                event.getContentId(),
                AdType.valueOf(event.getContentType())
        );

        if (adOptional.isEmpty()) {
            return;
        }
        Ad ad = adOptional.get();
        ad.setViews(ad.getViews() + 1);
        ad.setSpentAmount(ad.getSpentAmount().add(BigDecimal.valueOf(200)));
        ad.setDailySpend(ad.getDailySpend().add(BigDecimal.valueOf(200)));
        if (ad.getSpentAmount().compareTo(ad.getDailyBudget()) >= 0) return;
        adRepository.save(ad);
    }
}
