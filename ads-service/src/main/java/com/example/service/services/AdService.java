package com.example.service.services;

import com.example.service.clients.ContentClient;
import com.example.service.contexts.AuthContext;
import com.example.service.entities.Ad;
import com.example.service.entities.AdMetric;
import com.example.service.entities.AdTarget;
import com.example.service.entities.AdUserProfile;
import com.example.service.enums.AdStatus;
import com.example.service.enums.AdType;
import com.example.service.enums.Gender;
import com.example.service.enums.GenderOption;
import com.example.service.exceptions.NotFoundException;
import com.example.service.repositories.AdMetricRepository;
import com.example.service.repositories.AdRepository;
import com.example.service.requests.*;
import com.example.service.responses.ApiResponse;
import com.example.service.responses.CreatePostResponse;
import com.example.service.responses.CreateShortResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AdService {
    @Autowired
    private AdRepository adRepository;

    @Autowired
    private AdMetricRepository adMetricRepository;

    @Autowired
    private AdBudgetService adBudgetService;

    @Autowired
    private ContentClient contentClient;

    @Autowired
    private AdTargetService adTargetService;

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

    public Ad saveAdPost(CreatePostAdDto createPostAdDto) {
        CurrentUser currentUser = AuthContext.get();

        CreatePostDto postDto = createPostAdDto;

        List<MultipartFile> files = createPostAdDto.getFiles();

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime endDate = now.plusHours(createPostAdDto.getTime());

        CreateAdTargetDto dto = new CreateAdTargetDto();
        dto.setGender(createPostAdDto.getGender());
        dto.setAgeMin(createPostAdDto.getAgeMin());
        dto.setAgeMax(createPostAdDto.getAgeMax());
        AdTarget savedAdtarget = adTargetService.create(dto);

        ApiResponse<CreatePostResponse> createPostResponse =
                contentClient.createPost(postDto, files, currentUser.getUserId());
        CreatePostResponse createPostResponseBody = createPostResponse.getData();
        Ad ad = new Ad();
        ad.setUserId(currentUser.getUserId());
        ad.setAdContentId(createPostResponseBody.getId());
        ad.setSnapshotUrl(createPostResponseBody.getMedias().get(0));
        ad.setSnapshotCaption(createPostResponseBody.getCaption());
        ad.setSnapshotAvatarUrl(createPostResponseBody.getAvatarUrl());
        ad.setSnapshotUsername(createPostResponseBody.getUsername());
        ad.setAdType(AdType.POST);
        ad.setEndAt(endDate);
        ad.setAdTarget(savedAdtarget);

        Ad savedAd =  adRepository.save(ad);
        adBudgetService.save(savedAd, createPostAdDto.getBudget());
        AdMetric adMetric = new AdMetric();
        adMetric.setAd(savedAd);
        adMetricRepository.save(adMetric);
        return savedAd;
    }

    public Ad saveAdShort(CreateShortAdDto createShortAdDto) {
        CurrentUser currentUser = AuthContext.get();

        CreateShortAdDto shortDto = createShortAdDto;

        MultipartFile file = createShortAdDto.getFile();

        LocalDateTime now = LocalDateTime.now();

        LocalDateTime endDate = now.plusHours(createShortAdDto.getTime());

        CreateAdTargetDto dto = new CreateAdTargetDto();
        dto.setGender(createShortAdDto.getGender());
        dto.setAgeMin(createShortAdDto.getAgeMin());
        dto.setAgeMax(createShortAdDto.getAgeMax());
        AdTarget savedAdtarget = adTargetService.create(dto);

        ApiResponse<CreateShortResponse> createPostResponse =
                contentClient.createShort(shortDto, file, currentUser.getUserId());
        CreateShortResponse createShortResponseBody = createPostResponse.getData();
        Ad ad = new Ad();
        ad.setUserId(currentUser.getUserId());
        ad.setAdContentId(createShortResponseBody.getId());
        ad.setSnapshotUrl(createShortResponseBody.getMediaUrl());
        ad.setSnapshotCaption(createShortResponseBody.getCaption());
        ad.setSnapshotAvatarUrl(createShortResponseBody.getAvatarUrl());
        ad.setSnapshotUsername(createShortResponseBody.getUsername());
        ad.setAdType(AdType.SHORT);
        ad.setEndAt(endDate);
        ad.setAdTarget(savedAdtarget);

        Ad savedAd =  adRepository.save(ad);
        AdMetric adMetric = new AdMetric();
        adBudgetService.save(savedAd, createShortAdDto.getBudget());
        adMetric.setAd(savedAd);
        adMetricRepository.save(adMetric);
        return savedAd;
    }

    public Page<Ad> FindByUserId(UUID userId, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return adRepository.findByUserId(userId, pageable);
    }

    public Page<Ad> FindByPage(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return adRepository.findAll(pageable);
    }

    public Ad findById(Long id) {
        return adRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ad not found with id: " + id));
    }

    public void updateStatus(Long id , AdStatus adStatus) {
        Ad ad = findById(id);
        ad.setStatus(adStatus);
        adRepository.save(ad);
    }

    public Page<Ad> search(String keyword, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        return adRepository.search(keyword,pageable);
    }
}
