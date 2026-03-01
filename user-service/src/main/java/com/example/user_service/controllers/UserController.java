package com.example.user_service.controllers;

import com.example.user_service.contexts.AuthContext;
import com.example.user_service.entities.User;
import com.example.user_service.enums.StatusType;
import com.example.user_service.requests.CurrentUser;
import com.example.user_service.requests.UpdateUserRequest;
import com.example.user_service.responses.UserResponse;
import com.example.user_service.responses.UserSummaryResponse;
import com.example.user_service.services.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("account")
public class UserController {
    @Autowired
    UserService userService;

    @GetMapping("/current")
    public UserResponse getCurrentUser(HttpServletRequest request) {
        CurrentUser currentUser = AuthContext.get();
        User user = userService.findById(currentUser.getUserId());
        return UserResponse.fromEntity(user);
    }

    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/search")
    public Page<UserResponse> search(
            @RequestParam String keyword,
            @RequestParam (defaultValue = "0") int page,
            @RequestParam (defaultValue = "10") int size
    ){
        Page<User> userList = userService.findUserByName(keyword, page, size);
        return userList.map(UserResponse::fromEntity);
    }

    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/batch")
    public List<UserSummaryResponse> getUsersByIds(
            @RequestParam String ids
    ) {
        System.out.println("😀 ids= " + ids);

        if (ids == null || ids.isBlank()) {
            System.out.println("🔍 NOTHING");
            return List.of();
        }

        List<UUID> idList = Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .toList();

        System.out.println("😀 RESPONSE " + userService.findManyUser(idList)
                .stream()
                .map(UserSummaryResponse::fromEntity)
                .toList());

        return userService.findManyUser(idList)
                .stream()
                .map(UserSummaryResponse::fromEntity)
                .toList();
    }

    @GetMapping("/summary/{id}")
    public UserSummaryResponse getSummaryUserById(@PathVariable UUID id) {
        User user = userService.findById(id);
        return UserSummaryResponse.fromEntity(user);
    }

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable UUID id) {
        User user = userService.findById(id);
        return UserResponse.fromEntity(user);
    }

    @SecurityRequirement(name = "bearerAuth")
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateUser(
            @ModelAttribute UpdateUserRequest req,
            HttpServletRequest request
    ) throws Exception {
        CurrentUser currentUser = AuthContext.get();
        System.out.println("😀 userId: " + currentUser.getUserId());
        System.out.println("=== REQUEST INFO ===");
        System.out.println("Character Encoding: " + request.getCharacterEncoding());
        System.out.println("Content Type: " + request.getContentType());

        if (req.getFile() != null && !req.getFile().isEmpty()) {
            MultipartFile file = req.getFile();

            System.out.println("=== FILE INFO ===");
            System.out.println("File class: " + file.getClass().getName());
            System.out.println("Original filename: " + file.getOriginalFilename());
            System.out.println("Size: " + file.getSize());
            System.out.println("Content-Type: " + file.getContentType());

            byte[] bytesViaGetBytes = file.getBytes();
            System.out.println("=== VIA getBytes() ===");
            System.out.println("Length: " + bytesViaGetBytes.length);
            System.out.print("Magic bytes: ");
            for (int i = 0; i < 10 && i < bytesViaGetBytes.length; i++) {
                System.out.print(String.format("%02X ", bytesViaGetBytes[i]));
            }
            System.out.println();

            try (InputStream is = file.getInputStream()) {
                byte[] bytesViaStream = is.readAllBytes();
                System.out.println("=== VIA InputStream ===");
                System.out.println("Length: " + bytesViaStream.length);
                System.out.print("Magic bytes: ");
                for (int i = 0; i < 10 && i < bytesViaStream.length; i++) {
                    System.out.print(String.format("%02X ", bytesViaStream[i]));
                }
                System.out.println();
            }

            if (request instanceof MultipartHttpServletRequest) {
                MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
                MultipartFile rawFile = multipartRequest.getFile("file");

                if (rawFile != null) {
                    System.out.println("=== RAW REQUEST FILE ===");
                    byte[] rawBytes = rawFile.getBytes();
                    System.out.println("Length: " + rawBytes.length);
                    System.out.print("Magic bytes: ");
                    for (int i = 0; i < 10 && i < rawBytes.length; i++) {
                        System.out.print(String.format("%02X ", rawBytes[i]));
                    }
                    System.out.println();
                }
            }
        }

        User user = userService.updateUser(req,
                currentUser.getUserId(),
                currentUser.getRoles().stream().collect(Collectors.joining(",")));
        return user != null
                ? ResponseEntity.ok(Map.of("message", "Update success!"))
                : ResponseEntity.badRequest().body(Map.of("message", "Update failed!"));
    }

    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam StatusType status
    ) {

        User updatedUser = userService.updateUserStatus(status, id);

        return ResponseEntity.ok(UserResponse.fromEntity(updatedUser));
    }
}
