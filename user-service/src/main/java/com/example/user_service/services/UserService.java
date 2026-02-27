package com.example.user_service.services;

import com.example.user_service.clients.FollowClient;
import com.example.user_service.enums.Gender;
import com.example.user_service.exceptions.ConflictException;
import com.example.user_service.exceptions.NotFoundException;
import com.example.user_service.exceptions.ValidatorException;
import com.example.user_service.producers.UserEventProducer;
import com.example.user_service.requests.*;
import com.example.user_service.entities.Role;
import com.example.user_service.entities.Session;
import com.example.user_service.entities.User;
import com.example.user_service.enums.RoleType;
import com.example.user_service.enums.StatusType;
import com.example.user_service.repositories.UserRepository;
import com.example.user_service.responses.MediaResponse;
import com.example.user_service.responses.UserResponseExtend;
import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleService roleService;

    @Autowired
    FollowClient followClient;

    @Autowired
    UploadService uploadService;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    SessionService sessionService;

    @Autowired
    JwtService jwtService;

    @Autowired
    UserEventProducer  userEventProducer;

    private final long refreshTokenValidity = 30L * 24 * 3600 * 1000;

    @Transactional
    public User register(RegisterRequest req) {
        User user = new User();
        user.setUsername(req.getFullName()
                .trim()
                .toLowerCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^a-z0-9]", ""));
        String password =  req.getPassword();
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new ValidatorException("Password do not match!");
        }
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setDob(req.getDob());
        user.setFullName(req.getFullName());
        user.setGender(req.getGender());
        User savedUser =  userRepository.save(user);

        Role role = new Role();
        role.setUser(savedUser);
        role.setName(RoleType.CLIENT);
        roleService.create(role);

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

        if (req.getPhone() != null) {
            user.setPhone(req.getPhone());
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


    public Page<User> findUserByName(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page,size, Sort.by(Sort.Direction.DESC,"createdAt"));
        return userRepository.searchUser(keyword, pageable);
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


    public UserResponseExtend getUserById(UUID currentUserId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Boolean isFollowed = false;
        Boolean isBlocked = false;

        if (currentUserId != null && !currentUserId.equals(userId)) {
            try {
                Map<String, String> followStatus = followClient.isFollowed(userId, currentUserId.toString());
                isFollowed = "true".equals(followStatus.get("isFollow"));

                Map<String, String> blockStatus = followClient.isBlocked(userId, currentUserId.toString());
                isBlocked = "true".equals(blockStatus.get("isBlock"));
            } catch (Exception e) {
                System.err.println("Error fetching follow/block status: " + e.getMessage());
                e.printStackTrace();
            }
        }

        return UserResponseExtend.from(user, isFollowed, isBlocked);
    }

    public User getCurrentUser(String token) {
        Claims claims = jwtService.parseToken(token);
        String userId = claims.get("userId").toString();
        return this.findById(UUID.fromString(userId));
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
            user.setUsername(req.getFullName()
                    .trim()
                    .toLowerCase()
                    .replaceAll("\\s+", "")
                    .replaceAll("[^a-z0-9]", ""));
            user.setProviderId(req.getProviderId());
            user.setGender(Gender.OTHER);

            User savedUser = userRepository.save(user);

            Role role = new Role();
            role.setUser(savedUser);
            role.setName(RoleType.CLIENT);
            roleService.create(role);

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
}
