package com.example.user_service.services;

import com.example.user_service.clients.ContentClient;
import com.example.user_service.clients.FollowClient;
import com.example.user_service.enums.Gender;
import com.example.user_service.exceptions.ConflictException;
import com.example.user_service.exceptions.NotFoundException;
import com.example.user_service.exceptions.ValidatorException;
import com.example.user_service.producers.UserEventProducer;
import com.example.user_service.requests.*;
import com.example.user_service.entities.Session;
import com.example.user_service.entities.User;
import com.example.user_service.enums.RoleType;
import com.example.user_service.enums.StatusType;
import com.example.user_service.repositories.UserRepository;
import com.example.user_service.responses.ContentCountResponse;
import com.example.user_service.responses.RelationshipResponse;
import com.example.user_service.responses.MediaResponse;
import com.example.user_service.responses.UserResponseExtend;
import io.jsonwebtoken.Claims;
import jakarta.ws.rs.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

    @Autowired
    FollowClient followClient;

    @Autowired
    UploadService uploadService;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    SessionService sessionService;

    @Autowired
    ContentClient contentClient;

    @Autowired
    JwtService jwtService;

    @Autowired
    UserEventProducer  userEventProducer;

    private final long refreshTokenValidity = 30L * 24 * 3600 * 1000;

    @Transactional
    public User register(RegisterRequest req) {
        User user = new User();
        String password =  req.getPassword();
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new ValidatorException("Password do not match!");
        }
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ValidatorException("Email already exists!");
        }

        if (userRepository.existsByPhone(req.getPhone())) {
            throw new ValidatorException("Phone already exists!");
        }

        if (userRepository.existsByUsername(req.getUsername())) {
            throw new ValidatorException("Username already exists!");
        }
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setDob(req.getDob());
        user.setFullName(req.getFullName());
        user.setUsername(req.getUsername());
        user.setGender(req.getGender());
        User savedUser =  userRepository.save(user);

        UserProfileUpdatedEvent userEvent = new UserProfileUpdatedEvent();
        userEvent.setId(savedUser.getId());
        userEvent.setDob(savedUser.getDob());
        userEvent.setGender(savedUser.getGender());

        userEventProducer.emitUserCreated(userEvent);

        return savedUser;
    };

    public User findById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User resetPassword(ResetPasswordReq req) {

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        Claims claims = jwtService.parseToken(req.getResetToken());

        String type = claims.get("type", String.class);

        if (!"RESET_PASSWORD".equals(type)) {
            throw new RuntimeException("Invalid token type");
        }

        String email = claims.getSubject();

        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new NotFoundException("User not found");
        }

        user.setPassword(passwordEncoder.encode(req.getPassword()));

        return userRepository.save(user);
    }

    public List<User> findManyUser(List<UUID> ids) {
        return userRepository.findAllById(ids);
    }
    
    public Map<String,String> login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail());
        if(user == null || !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new NotFoundException("Email or password incorrect!");
        }
        String refreshToken = jwtService.generateRefreshToken();
        Session session = new Session();
        session.setUser(user);
        session.setToken(refreshToken);
        session.setExpiredAt(
                LocalDateTime.now().plusSeconds(refreshTokenValidity / 1000)
        );
        sessionService.create(session);
        String accessToken = jwtService.generateAccessToken(session);
        Map<String,String> map = new HashMap<>();
        map.put("refreshToken", refreshToken);
        map.put("accessToken", accessToken);
        return map;
    }

    @Transactional
    public User updateUser(UpdateUserRequest req, UUID id, String roles) {

        User user = this.findById(id);

        boolean profileChanged = false;
        boolean avatarChanged = false;

        UserProfileUpdatedEvent profileEvent = new UserProfileUpdatedEvent();
        profileEvent.setId(id);

        UserAvatarUpdateEvent avatarEvent = new UserAvatarUpdateEvent();
        avatarEvent.setId(id);

        if (req.getFullName() != null) {
            user.setFullName(req.getFullName());
            profileChanged = true;
        }

        if (req.getDob() != null) {
            user.setDob(req.getDob());
            profileEvent.setDob(req.getDob());
            profileChanged = true;
        }

        if (req.getGender() != null) {
            user.setGender(req.getGender());
            profileEvent.setGender(req.getGender());
            profileChanged = true;
        }

        if (req.getUsername() != null) {
            user.setUsername(req.getUsername());
            profileChanged = true;
        }

        if (req.getBio() != null) {
            user.setBio(req.getBio());
            profileChanged = true;
        }

        if (req.getFile() != null) {

            if (user.getAvatarId() != null) {
                uploadService.delete(user.getAvatarId(), id, roles);
            }

            MediaResponse media = uploadService.upload(req.getFile(), id, roles);

            user.setAvatarUrl(media.getUrl());
            user.setAvatarId(media.getId());

            avatarEvent.setAvatarUrl(media.getUrl());
            avatarChanged = true;
        }

        User savedUser = userRepository.save(user);

        if (profileChanged) {
            userEventProducer.emitUserProfileUpdated(profileEvent);
        }

        if (avatarChanged) {
            userEventProducer.emitUserAvatarUpdated(avatarEvent);
        }

        return savedUser;
    }

    public UserResponseExtend getUserByUsername(UUID currentUserId, String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean isFollowed = false;
        boolean isBlocked = false;
        long followersCount = user.getFollowers();
        long followingCount = user.getFollowing();
        boolean hasNewStoryEvent = false;
        long postCount = 0;
        long shortCount = 0;

        try {
            RelationshipResponse relationshipStatus =
                    followClient.getRelationShip(user.getId(),
                            currentUserId != null ? currentUserId.toString() : null);

            ContentCountResponse contentCountResponse = contentClient.getContentCount(user.getId());


            isBlocked = relationshipStatus.isBlock();
            isFollowed = relationshipStatus.isFollow();
            hasNewStoryEvent = contentCountResponse.hasNewStory();
            postCount = contentCountResponse.postCount();
            shortCount = contentCountResponse.shortCount();

        } catch (Exception e) {
            System.err.println("Error fetching follow/block status: " + e.getMessage());
        }

        return UserResponseExtend.from(
                user,
                isFollowed,
                isBlocked,
                followersCount,
                followingCount,
                postCount,
                shortCount,
                hasNewStoryEvent
        );
    }


    public Page<User> findUserByName(String keyword, UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.searchUser(keyword, userId, pageable);

        if (users.isEmpty() || userId == null) {
            return users;
        }

        List<UUID> targetUserIds = users.getContent()
                .stream()
                .map(User::getId)
                .collect(Collectors.toList());

        Map<UUID, Boolean> blockedMap = followClient.checkBlockedUsers(targetUserIds, userId.toString());

        List<User> filteredUsers = users.getContent()
                .stream()
                .filter(user -> !blockedMap.getOrDefault(user.getId(), false))
                .collect(Collectors.toList());

        return new PageImpl<>(filteredUsers, pageable, users.getTotalElements());
    }

    public Page<User> findUserByRole(String keyword,  RoleType role,int page, int size) {
        Pageable pageable = PageRequest.of(page,size, Sort.by(Sort.Direction.DESC,"createdAt"));
        return userRepository.searchUserWithRole(keyword,  role ,pageable);
    }

    @Transactional
    public User updateUserStatus(StatusType status, UUID id) {
        User user = this.findById(id);
        if (user.getStatus() == status) {
            return user;
        }
        user.setStatus(status);
        UserStatusUpdateEvent event = new UserStatusUpdateEvent();
        event.setId(id);
        event.setStatus(status);
        User savedUser = userRepository.save(user);
        userEventProducer.emitUserStatusUpdated(event);
        return savedUser;
    }

    @Transactional
    public User updateUserRole(UUID id, RoleType newRole) {
        User user = this.findById(id);

        if (user.getStatus() == StatusType.BANNED
                || user.getStatus() == StatusType.DELETED) {
            throw new RuntimeException("User is not eligible for role update");
        }

        if (user.getRole() == RoleType.ADMIN) {
            throw new RuntimeException("Admin cannot be modified");
        }

        if (user.getRole() == newRole) {
            return user;
        }

        user.setRole(newRole);

        return userRepository.save(user);
    }


    public UserResponseExtend getUserById(UUID currentUserId, UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean isFollowed = false;
        boolean isBlocked = false;
        boolean hasNewStory = false;
        long followersCount = user.getFollowers();
        long followingCount = user.getFollowing();
        long postCount = 0;
        long shotCount = 0;

        try {
            RelationshipResponse relationShipStatus =
                    followClient.getRelationShip(userId,
                            currentUserId != null ? currentUserId.toString() : null);

            ContentCountResponse contentCountResponse = contentClient.getContentCount(userId);

            isBlocked = relationShipStatus.isBlock();
            isFollowed = relationShipStatus.isFollow();
            hasNewStory = contentCountResponse.hasNewStory();
            postCount =  contentCountResponse.postCount();
            shotCount = contentCountResponse.shortCount();

        } catch (Exception e) {
            System.err.println("Error fetching follow/block status: " + e.getMessage());
        }

        return UserResponseExtend.from(
                user,
                isFollowed,
                isBlocked,
                followersCount,
                followingCount,
                postCount,
                shotCount,
                hasNewStory
        );
    }

    public User getCurrentUser(String token) {
        Claims claims = jwtService.parseToken(token);
        String userId = claims.get("userId").toString();
        return this.findById(UUID.fromString(userId));
    }

    private String generateUniqueUsername(String fullName) {
        String base = fullName
                .trim()
                .toLowerCase()
                .replaceAll("\\s+", ".")
                .replaceAll("[^a-z0-9.]", "");

        if (!userRepository.existsByUsername(base)) {
            return base;
        }

        String candidate;
        do {
            String suffix = String.valueOf((int)(Math.random() * 9000) + 1000);
            candidate = base + suffix;
        } while (userRepository.existsByUsername(candidate));

        return candidate;
    }

    @Transactional
    public Map<String, String> loginWithGoogle(GoogleRequest req) {

        User user = userRepository.findByEmail(req.getEmail());

        if (user == null) {
            user = new User();
            user.setEmail(req.getEmail());
            user.setAvatarUrl(req.getAvatarUrl());
            user.setProviderId(req.getProviderId());
            user.setFullName(req.getFullName());
            user.setStatus(StatusType.ACTIVE);
            user.setUsername(generateUniqueUsername(req.getFullName()));
            user.setGender(Gender.OTHER);

            User savedUser = userRepository.save(user);

            UserProfileUpdatedEvent userEvent = new UserProfileUpdatedEvent();
            userEvent.setId(savedUser.getId());
            userEvent.setDob(savedUser.getDob());
            userEvent.setGender(savedUser.getGender());

            userEventProducer.emitUserCreated(userEvent);
        }

        if (user.getStatus() != StatusType.ACTIVE) {
            throw new ConflictException("User not active");
        }

        String refreshToken = jwtService.generateRefreshToken();

        Session session = new Session();
        session.setUser(user);
        session.setToken(refreshToken);
        session.setExpiredAt(
                LocalDateTime.now().plusSeconds(refreshTokenValidity / 1000)
        );

        Session savedSession = sessionService.create(session);
        String accessToken = jwtService.generateAccessToken(savedSession);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken
        );
    }



    public void logout(Long id) {
        sessionService.delete(id);
    }

    public String refreshToken(String token) {
        Session session = sessionService.findByToken(token);
        if(session.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new ValidatorException("Refresh token expired");
        }
        return jwtService.generateAccessToken(session);
    }

    public void handleFollow(UUID followedId, UUID followerId) {
        User follower = this.findById(followerId);
        User followed = this.findById(followedId);
        follower.setFollowing(follower.getFollowing() + 1);
        followed.setFollowers(followed.getFollowers() + 1);
    }

    public void handleUnFollow(UUID followedId, UUID followerId) {
        User follower = this.findById(followerId);
        User followed = this.findById(followedId);
        follower.setFollowing(follower.getFollowing() - 1);
        followed.setFollowers(followed.getFollowers() - 1);
    }

    public List<User> validateUsers(List<UserBatchReq> requests) {
        List<UUID> ids = requests.stream()
                .map(UserBatchReq::getId)
                .toList();

        List<User> users = userRepository.findAllById(ids);

        Map<UUID, String> userMap = users.stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));

        for (UserBatchReq req : requests) {
            String actualUsername = userMap.get(req.getId());

            if (actualUsername == null) {
                throw new BadRequestException("userId is not exist: " + req.getId());
            }

            if (!actualUsername.equals(req.getUsername())) {
                throw new BadRequestException("username don not match: " + req.getId());
            }
        }

        return users;
    }
}
