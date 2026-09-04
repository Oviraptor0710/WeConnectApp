package com.weconnect.service;

import com.weconnect.dto.user.request.UpdateHobbiesRequest;
import com.weconnect.dto.user.request.UpdateProfileRequest;
import com.weconnect.dto.user.response.HobbyResponse;
import com.weconnect.dto.user.response.MediaUploadResponse;
import com.weconnect.dto.common.response.PaginationResponse;
import com.weconnect.dto.user.response.ProfileWarningResponse;
import com.weconnect.dto.user.response.SuggestionResponse;
import com.weconnect.dto.user.response.UserPublicProfileResponse;
import com.weconnect.dto.user.response.UserResponse;
import com.weconnect.dto.user.response.UserSearchItemResponse;
import com.weconnect.dto.user.response.UserSearchResponse;
import com.weconnect.domain.friend.FriendshipStatus;
import com.weconnect.entity.FriendRequest;
import com.weconnect.entity.Friendship;
import com.weconnect.entity.Hobby;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.FriendRequestRepository;
import com.weconnect.repository.FriendshipRepository;
import com.weconnect.repository.HobbyRepository;
import com.weconnect.repository.UserRepository;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.*;

@Service
public class UserProfileService {
    private static final String ROLE_USER = "USER";

    private final UserRepository userRepository;
    private final HobbyRepository hobbyRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final MediaStorageService mediaStorageService;

    public UserProfileService(
            UserRepository userRepository,
            HobbyRepository hobbyRepository,
            FriendshipRepository friendshipRepository,
            FriendRequestRepository friendRequestRepository,
            MediaStorageService mediaStorageService
    ) {
        this.userRepository = userRepository;
        this.hobbyRepository = hobbyRepository;
        this.friendshipRepository = friendshipRepository;
        this.friendRequestRepository = friendRequestRepository;
        this.mediaStorageService = mediaStorageService;
    }

    @Transactional(readOnly = true)
    public List<HobbyResponse> listHobbies() {
        return hobbyRepository.findAllByOrderByCategoryAscNameAsc()
                .stream()
                .map(HobbyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getMyProfile(Long userId) {
        return UserResponse.from(requireUserWithHobbies(userId));
    }

    @Transactional
    public UserResponse updateMyProfile(Long userId, UpdateProfileRequest request) {
        User user = requireUserWithHobbies(userId);

        if (request.isProvided("full_name") && request.getFullName() != null) {
            String fullName = request.getFullName().trim();
            if (fullName.isEmpty()) {
                throw BusinessException.badRequest("Họ tên không được để trống");
            }
            user.setFullName(fullName);
        }

        if (request.isProvided("bio")) user.setBio(request.getBio());
        if (request.isProvided("location")) user.setLocation(request.getLocation());
        if (request.isProvided("japanese_level")) user.setJapaneseLevel(request.getJapaneseLevel());
        if (request.isProvided("job_title")) user.setJobTitle(request.getJobTitle());
        if (request.isProvided("education")) user.setEducation(request.getEducation());
        if (request.isProvided("relationship_status")) user.setRelationshipStatus(request.getRelationshipStatus());

        // Bỏ qua null ở hai field này để giữ nguyên contract cập nhật từng phần.
        if (request.isProvided("gender") && request.getGender() != null) user.setGender(request.getGender());
        if (request.isProvided("date_of_birth") && request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.isProvided("phone_number")) {
            String phoneNumber = normalizeNullable(request.getPhoneNumber());
            if (phoneNumber != null) {
                userRepository.findByPhoneNumber(phoneNumber)
                        .filter(existing -> !existing.getUserId().equals(userId))
                        .ifPresent(existing -> {
                            throw BusinessException.conflict("Số điện thoại đã được sử dụng");
                        });
            }
            user.setPhoneNumber(phoneNumber);
        }

        userRepository.save(user);
        return UserResponse.from(user);
    }

    @Transactional
    public MediaUploadResponse updateAvatar(Long userId, MultipartFile file) {
        User user = requireUser(userId);
        String url = mediaStorageService.saveImage(file, "avatars", 5);
        user.setAvatarUrl(url);
        userRepository.save(user);
        return new MediaUploadResponse(url);
    }

    @Transactional
    public MediaUploadResponse updateCover(Long userId, MultipartFile file) {
        User user = requireUser(userId);
        String url = mediaStorageService.saveImage(file, "covers", 10);
        user.setCoverUrl(url);
        userRepository.save(user);
        return new MediaUploadResponse(url);
    }

    @Transactional
    public void updateLanguage(Long userId, String language) {
        String normalized = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("vi") && !normalized.equals("ja")) {
            throw BusinessException.badRequest("Ngôn ngữ phải là 'vi' hoặc 'ja'");
        }
        User user = requireUser(userId);
        user.setPreferredLanguage(normalized);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<HobbyResponse> getMyHobbies(Long userId) {
        return requireUserWithHobbies(userId).getHobbies()
                .stream()
                .map(HobbyResponse::from)
                .toList();
    }

    @Transactional
    public List<HobbyResponse> updateMyHobbies(Long userId, UpdateHobbiesRequest request) {
        User user = requireUserWithHobbies(userId);
        List<Integer> requestedIds = request.hobbyIds();
        LinkedHashSet<Integer> uniqueIds = new LinkedHashSet<>(requestedIds);
        List<Hobby> found = hobbyRepository.findAllById(uniqueIds);
        Map<Integer, Hobby> byId = new HashMap<>();
        found.forEach(hobby -> byId.put(hobby.getHobbyId(), hobby));

        List<Integer> invalidIds = uniqueIds.stream()
                .filter(id -> !byId.containsKey(id))
                .toList();
        if (!invalidIds.isEmpty()) {
            throw BusinessException.unprocessableEntity("Sở thích không tồn tại: " + invalidIds);
        }

        List<Hobby> ordered = uniqueIds.stream().map(byId::get).toList();
        user.setHobbies(new ArrayList<>(ordered));
        userRepository.save(user);
        return ordered.stream().map(HobbyResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserSearchResponse searchUsers(
            Long currentUserId,
            String keyword,
            String gender,
            Integer minAge,
            Integer maxAge,
            String japaneseLevel,
            String hobbies,
            String location,
            int page,
            int pageSize
    ) {
        Set<Integer> hobbyIds = parseHobbyIds(hobbies);
        Specification<User> specification = buildSearchSpecification(
                currentUserId, keyword, gender, minAge, maxAge, japaneseLevel, hobbyIds, location
        );

        Page<User> result = userRepository.findAll(
                specification,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.ASC, "fullName"))
        );
        Map<Long, FriendshipStatus> statuses = friendshipStatuses(currentUserId);

        List<UserSearchItemResponse> data = result.getContent().stream()
                .map(user -> UserSearchItemResponse.from(
                        user,
                        statuses.getOrDefault(user.getUserId(), FriendshipStatus.NONE)
                ))
                .toList();

        return new UserSearchResponse(
                data,
                new PaginationResponse(page, pageSize, result.getTotalElements(), result.getTotalPages())
        );
    }

    @Transactional(readOnly = true)
    public SuggestionResponse getSuggestions(Long currentUserId, int limit) {
        User currentUser = requireUserWithHobbies(currentUserId);
        List<String> missingFields = new ArrayList<>();
        if (isBlank(currentUser.getJapaneseLevel())) missingFields.add("japanese_level");
        if (currentUser.getHobbies() == null || currentUser.getHobbies().isEmpty()) missingFields.add("hobbies");

        if (!missingFields.isEmpty()) {
            return new SuggestionResponse(
                    List.of(),
                    new ProfileWarningResponse("PROFILE_INCOMPLETE", missingFields)
            );
        }

        Set<Long> excluded = new HashSet<>();
        excluded.add(currentUserId);
        friendshipRepository.findAllForUser(currentUserId).forEach(friendship ->
                excluded.add(otherUserId(friendship, currentUserId))
        );
        friendRequestRepository.findPendingForUser(currentUserId).forEach(request ->
                excluded.add(otherUserId(request, currentUserId))
        );

        Set<Integer> myHobbyIds = new HashSet<>();
        currentUser.getHobbies().forEach(hobby -> myHobbyIds.add(hobby.getHobbyId()));

        List<ScoredUser> scoredUsers = userRepository
                .findAllByIsVerifiedTrueAndRoleOrderByFullNameAsc(ROLE_USER)
                .stream()
                .filter(candidate -> !excluded.contains(candidate.getUserId()))
                .map(candidate -> new ScoredUser(score(currentUser, myHobbyIds, candidate), candidate))
                .filter(scored -> scored.score() > 0)
                .sorted(Comparator.comparingInt(ScoredUser::score).reversed())
                .limit(limit)
                .toList();

        List<UserSearchItemResponse> data = scoredUsers.stream()
                .map(scored -> UserSearchItemResponse.from(scored.user(), FriendshipStatus.NONE))
                .toList();
        return new SuggestionResponse(data, null);
    }

    @Transactional(readOnly = true)
    public UserPublicProfileResponse getUserProfile(Long currentUserId, Long userId) {
        User user = requireUserWithHobbies(userId);
        return UserPublicProfileResponse.from(user, friendshipStatus(currentUserId, userId));
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("Người dùng không tồn tại"));
    }

    private User requireUserWithHobbies(Long userId) {
        return userRepository.findWithHobbiesByUserId(userId)
                .orElseThrow(() -> BusinessException.notFound("Người dùng không tồn tại"));
    }

    private Specification<User> buildSearchSpecification(
            Long currentUserId,
            String keyword,
            String gender,
            Integer minAge,
            Integer maxAge,
            String japaneseLevel,
            Set<Integer> hobbyIds,
            String location
    ) {
        return (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.notEqual(root.get("userId"), currentUserId));
            predicates.add(criteriaBuilder.isTrue(root.get("isVerified")));
            predicates.add(criteriaBuilder.equal(root.get("role"), ROLE_USER));

            if (!isBlank(keyword)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("fullName")),
                        "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%"
                ));
            }
            if (!isBlank(gender)) predicates.add(criteriaBuilder.equal(root.get("gender"), gender));
            if (!isBlank(japaneseLevel)) {
                predicates.add(criteriaBuilder.equal(root.get("japaneseLevel"), japaneseLevel));
            }
            if (!isBlank(location)) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + location.trim().toLowerCase(Locale.ROOT) + "%"
                ));
            }

            LocalDate today = LocalDate.now();
            if (minAge != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("dateOfBirth"), safeMinusYears(today, minAge)
                ));
            }
            if (maxAge != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("dateOfBirth"), safeMinusYears(today, maxAge)
                ));
            }
            if (!hobbyIds.isEmpty()) {
                query.distinct(true);
                predicates.add(root.join("hobbies", JoinType.INNER).get("hobbyId").in(hobbyIds));
            }

            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private Map<Long, FriendshipStatus> friendshipStatuses(Long currentUserId) {
        Map<Long, FriendshipStatus> statuses = new HashMap<>();
        friendshipRepository.findAllForUser(currentUserId).forEach(friendship ->
                statuses.put(otherUserId(friendship, currentUserId), FriendshipStatus.FRIEND)
        );
        friendRequestRepository.findPendingForUser(currentUserId).forEach(request -> {
            Long otherId = otherUserId(request, currentUserId);
            statuses.putIfAbsent(
                    otherId,
                    request.getSender().getUserId().equals(currentUserId)
                            ? FriendshipStatus.REQUEST_SENT
                            : FriendshipStatus.REQUEST_RECEIVED
            );
        });
        return statuses;
    }

    private FriendshipStatus friendshipStatus(Long currentUserId, Long otherUserId) {
        long first = Math.min(currentUserId, otherUserId);
        long second = Math.max(currentUserId, otherUserId);
        if (friendshipRepository.existsByUser1_UserIdAndUser2_UserId(first, second)) {
            return FriendshipStatus.FRIEND;
        }

        List<FriendRequest> pending = friendRequestRepository.findPendingBetween(currentUserId, otherUserId);
        if (pending.isEmpty()) return FriendshipStatus.NONE;
        return pending.get(0).getSender().getUserId().equals(currentUserId)
                ? FriendshipStatus.REQUEST_SENT
                : FriendshipStatus.REQUEST_RECEIVED;
    }

    private int score(User currentUser, Set<Integer> myHobbyIds, User candidate) {
        long sharedHobbies = candidate.getHobbies().stream()
                .map(Hobby::getHobbyId)
                .filter(myHobbyIds::contains)
                .count();
        int score = Math.toIntExact(sharedHobbies * 2);
        if (Objects.equals(candidate.getJapaneseLevel(), currentUser.getJapaneseLevel())) score += 3;
        if (!isBlank(candidate.getLocation()) && Objects.equals(candidate.getLocation(), currentUser.getLocation())) {
            score += 1;
        }
        return score;
    }

    private Long otherUserId(Friendship friendship, Long currentUserId) {
        return friendship.getUser1().getUserId().equals(currentUserId)
                ? friendship.getUser2().getUserId()
                : friendship.getUser1().getUserId();
    }

    private Long otherUserId(FriendRequest request, Long currentUserId) {
        return request.getSender().getUserId().equals(currentUserId)
                ? request.getReceiver().getUserId()
                : request.getSender().getUserId();
    }

    private Set<Integer> parseHobbyIds(String hobbies) {
        if (isBlank(hobbies)) return Set.of();
        Set<Integer> ids = new LinkedHashSet<>();
        for (String value : hobbies.split(",")) {
            try {
                ids.add(Integer.parseInt(value.trim()));
            } catch (NumberFormatException ignored) {
                // Bỏ qua các phần tử không phải số trong payload sở thích.
            }
        }
        return ids;
    }

    private LocalDate safeMinusYears(LocalDate date, int years) {
        try {
            return date.minusYears(years);
        } catch (DateTimeException exception) {
            return LocalDate.of(date.getYear() - years, date.getMonth(), 28);
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record ScoredUser(int score, User user) {
    }
}
