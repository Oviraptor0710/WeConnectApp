package com.weconnect.controller;

import com.weconnect.dto.user.request.UpdateHobbiesRequest;
import com.weconnect.dto.user.request.UpdateLanguageRequest;
import com.weconnect.dto.user.request.UpdateProfileRequest;
import com.weconnect.dto.common.response.DataResponse;
import com.weconnect.dto.user.response.HobbyResponse;
import com.weconnect.dto.user.response.MediaUploadResponse;
import com.weconnect.dto.user.response.SuggestionResponse;
import com.weconnect.dto.user.response.UserPublicProfileResponse;
import com.weconnect.dto.user.response.UserResponse;
import com.weconnect.dto.user.response.UserSearchResponse;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.UserProfileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Validated
public class UserProfileController {
    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/hobbies")
    public List<HobbyResponse> listHobbies() {
        return userProfileService.listHobbies();
    }

    @GetMapping("/users/me")
    public UserResponse getMyProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return userProfileService.getMyProfile(principal.getUser().getUserId());
    }

    @PutMapping("/users/me")
    public UserResponse updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return userProfileService.updateMyProfile(principal.getUser().getUserId(), request);
    }

    @PutMapping(value = "/users/me/avatar", consumes = "multipart/form-data")
    public MediaUploadResponse updateAvatar(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return userProfileService.updateAvatar(principal.getUser().getUserId(), file);
    }

    @PutMapping(value = "/users/me/cover", consumes = "multipart/form-data")
    public MediaUploadResponse updateCover(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return userProfileService.updateCover(principal.getUser().getUserId(), file);
    }

    @PutMapping("/users/me/language")
    public ResponseEntity<Void> updateLanguage(
            @Valid @RequestBody UpdateLanguageRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        userProfileService.updateLanguage(principal.getUser().getUserId(), request.language());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/me/hobbies")
    public List<HobbyResponse> getMyHobbies(@AuthenticationPrincipal CustomUserDetails principal) {
        return userProfileService.getMyHobbies(principal.getUser().getUserId());
    }

    @PutMapping("/users/me/hobbies")
    public List<HobbyResponse> updateMyHobbies(
            @Valid @RequestBody UpdateHobbiesRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return userProfileService.updateMyHobbies(principal.getUser().getUserId(), request);
    }

    @GetMapping("/users/search")
    public UserSearchResponse searchUsers(
            @RequestParam(required = false, name = "q") String keyword,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false, name = "min_age") @Min(1) @Max(120) Integer minAge,
            @RequestParam(required = false, name = "max_age") @Min(1) @Max(120) Integer maxAge,
            @RequestParam(required = false, name = "japanese_level") String japaneseLevel,
            @RequestParam(required = false) String hobbies,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return userProfileService.searchUsers(
                principal.getUser().getUserId(),
                keyword,
                gender,
                minAge,
                maxAge,
                japaneseLevel,
                hobbies,
                location,
                page,
                pageSize
        );
    }

    @GetMapping("/users/suggestions")
    public SuggestionResponse getSuggestions(
            @RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return userProfileService.getSuggestions(principal.getUser().getUserId(), limit);
    }

    @GetMapping("/users/{userId}")
    public DataResponse<UserPublicProfileResponse> getUserProfile(
            @PathVariable Long userId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(
                userProfileService.getUserProfile(principal.getUser().getUserId(), userId)
        );
    }
}
