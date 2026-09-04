package com.weconnect.service;

import com.weconnect.dto.event.request.CreateEventRequest;
import com.weconnect.dto.event.request.CreateFeedbackRequest;
import com.weconnect.dto.event.request.UpdateEventRequest;
import com.weconnect.dto.event.response.EventImageResponse;
import com.weconnect.dto.event.response.EventOverviewResponse;
import com.weconnect.dto.event.response.EventResponse;
import com.weconnect.dto.event.response.EventStatisticsResponse;
import com.weconnect.dto.event.response.FeedbackResponse;
import com.weconnect.dto.event.response.ParticipantResponse;
import com.weconnect.dto.event.response.RegistrationResponse;
import com.weconnect.entity.Event;
import com.weconnect.entity.EventFeedback;
import com.weconnect.entity.EventRegistration;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.repository.EventFeedbackRepository;
import com.weconnect.repository.EventRegistrationRepository;
import com.weconnect.repository.EventRepository;
import com.weconnect.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class EventService {
    private static final String ORGANIZER = "ORGANIZER";

    private final EventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final EventFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final MediaStorageService mediaStorageService;

    public EventService(
            EventRepository eventRepository,
            EventRegistrationRepository registrationRepository,
            EventFeedbackRepository feedbackRepository,
            UserRepository userRepository,
            MediaStorageService mediaStorageService
    ) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.mediaStorageService = mediaStorageService;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listEvents(String keyword, String status, int page, int pageSize, Long userId) {
        List<Event> events = eventRepository.findAll(Sort.by(Sort.Direction.ASC, "startTime"));
        String normalizedKeyword = keyword == null ? null : keyword.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = status == null ? null : status.trim().toUpperCase(Locale.ROOT);
        List<Event> filtered = events.stream()
                .filter(event -> normalizedKeyword == null || normalizedKeyword.isBlank()
                        || event.getTitle().toLowerCase(Locale.ROOT).contains(normalizedKeyword))
                .filter(event -> normalizedStatus == null || normalizedStatus.isBlank()
                        || normalizedStatus.equals(event.getStatus()))
                .toList();
        return page(filtered, page, pageSize).stream().map(event -> toResponse(event, userId)).toList();
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listManagedEvents(Long userId, int page, int pageSize) {
        requireOrganizer(userId);
        List<Event> events = eventRepository.findByOrganizerUserIdOrderByCreatedAtDesc(userId);
        return page(events, page, pageSize).stream().map(event -> toResponse(event, userId)).toList();
    }

    @Transactional(readOnly = true)
    public EventOverviewResponse overview(Long userId) {
        requireOrganizer(userId);
        List<Event> events = eventRepository.findAll().stream()
                .filter(event -> event.getOrganizer().getUserId().equals(userId))
                .toList();
        List<Long> ids = events.stream().map(Event::getEventId).toList();
        long registrations = ids.isEmpty() ? 0 : registrationRepository.countByEventEventIdIn(ids);
        List<EventFeedback> feedback = ids.isEmpty() ? List.of() : ids.stream()
                .flatMap(id -> feedbackRepository.findByEventEventId(id).stream())
                .toList();
        return new EventOverviewResponse(
                events.size(), countStatus(events, "UPCOMING"), countStatus(events, "ONGOING"),
                countStatus(events, "ENDED"), registrations, average(feedback)
        );
    }

    @Transactional(readOnly = true)
    public EventResponse getEvent(Long eventId, Long userId) {
        return toResponse(requireEvent(eventId), userId);
    }

    @Transactional
    public EventResponse create(Long userId, CreateEventRequest request) {
        User organizer = requireOrganizer(userId);
        validateTimes(request.startTime(), request.endTime());
        Event event = new Event();
        event.setOrganizer(organizer);
        event.setTitle(request.title().trim());
        event.setCategory(request.category());
        event.setDescription(request.description());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setLocation(request.location());
        event.setCapacity(request.normalizedCapacity());
        event.setImageUrl(request.imageUrl());
        event.setStatus("UPCOMING");
        return toResponse(eventRepository.save(event), userId);
    }

    @Transactional
    public EventResponse update(Long eventId, Long userId, UpdateEventRequest request) {
        Event event = requireOwnedEvent(eventId, userId);
        LocalDateTime start = request.startTime() == null ? event.getStartTime() : request.startTime();
        LocalDateTime end = request.endTime() == null ? event.getEndTime() : request.endTime();
        validateTimes(start, end);
        if (request.title() != null) {
            if (request.title().isBlank()) throw BusinessException.badRequest("Tiêu đề không được để trống");
            event.setTitle(request.title().trim());
        }
        if (request.category() != null) event.setCategory(request.category());
        if (request.description() != null) event.setDescription(request.description());
        if (request.startTime() != null) event.setStartTime(request.startTime());
        if (request.endTime() != null) event.setEndTime(request.endTime());
        if (request.location() != null) event.setLocation(request.location());
        if (request.capacity() != null) event.setCapacity(request.capacity());
        if (request.imageUrl() != null) event.setImageUrl(request.imageUrl());
        if (request.status() != null) event.setStatus(request.status().trim().toUpperCase(Locale.ROOT));
        return toResponse(eventRepository.save(event), userId);
    }

    @Transactional
    public void delete(Long eventId, Long userId) {
        eventRepository.delete(requireOwnedEvent(eventId, userId));
    }

    @Transactional(readOnly = true)
    public EventImageResponse uploadImage(Long userId, MultipartFile file) {
        requireOrganizer(userId);
        return new EventImageResponse(mediaStorageService.saveImage(file, "events", 10));
    }

    @Transactional
    public RegistrationResponse register(Long eventId, Long userId) {
        Event event = requireEvent(eventId);
        if (registrationRepository.existsByEventEventIdAndUserUserId(eventId, userId)) {
            throw BusinessException.conflict("Bạn đã đăng ký sự kiện này");
        }
        if (registrationRepository.countByEventEventId(eventId) >= event.getCapacity()) {
            throw BusinessException.conflict("Sự kiện đã hết chỗ");
        }
        EventRegistration registration = new EventRegistration();
        registration.setEvent(event);
        registration.setUser(requireUser(userId));
        registration = registrationRepository.save(registration);
        return new RegistrationResponse(registration.getRegistrationId(), registration.getRegisteredAt());
    }

    @Transactional
    public void cancelRegistration(Long eventId, Long userId) {
        EventRegistration registration = registrationRepository
                .findByEventEventIdAndUserUserId(eventId, userId)
                .orElseThrow(() -> BusinessException.notFound("Bạn chưa đăng ký sự kiện này"));
        registrationRepository.delete(registration);
    }

    @Transactional(readOnly = true)
    public List<FeedbackResponse> listFeedback(Long eventId, int page, int pageSize) {
        requireEvent(eventId);
        return page(feedbackRepository.findByEventEventIdOrderByCreatedAtDesc(eventId), page, pageSize)
                .stream().map(FeedbackResponse::from).toList();
    }

    @Transactional
    public Map<String, Object> createFeedback(Long eventId, Long userId, CreateFeedbackRequest request) {
        Event event = requireEvent(eventId);
        if (!registrationRepository.existsByEventEventIdAndUserUserId(eventId, userId)) {
            throw BusinessException.forbidden("Chỉ người đã đăng ký mới được gửi feedback");
        }
        if (feedbackRepository.existsByEventEventIdAndUserUserId(eventId, userId)) {
            throw BusinessException.conflict("Bạn đã gửi feedback cho sự kiện này");
        }
        EventFeedback feedback = new EventFeedback();
        feedback.setEvent(event);
        feedback.setUser(requireUser(userId));
        feedback.setRating(request.rating());
        feedback.setComment(request.comment());
        feedback = feedbackRepository.save(feedback);
        return Map.of("feedback_id", feedback.getFeedbackId(), "rating", feedback.getRating());
    }

    @Transactional(readOnly = true)
    public EventStatisticsResponse statistics(Long eventId, Long userId) {
        Event event = requireOwnedEvent(eventId, userId);
        long registrations = registrationRepository.countByEventEventId(eventId);
        List<EventFeedback> feedback = feedbackRepository.findByEventEventId(eventId);
        int[] distribution = new int[6];
        for (EventFeedback item : feedback) {
            if (item.getRating() != null && item.getRating() >= 1 && item.getRating() <= 5) distribution[item.getRating()]++;
        }
        return new EventStatisticsResponse(
                eventId, event.getTitle(), registrations, event.getCapacity(),
                event.getCapacity() == 0 ? 0 : round((double) registrations / event.getCapacity(), 4),
                average(feedback), feedback.size(),
                new EventStatisticsResponse.RatingDistributionResponse(
                        distribution[1], distribution[2], distribution[3], distribution[4], distribution[5]
                )
        );
    }

    @Transactional(readOnly = true)
    public List<ParticipantResponse> participants(Long eventId, Long userId) {
        requireOwnedEvent(eventId, userId);
        return registrationRepository.findByEventEventId(eventId).stream().map(ParticipantResponse::from).toList();
    }

    private EventResponse toResponse(Event event, Long userId) {
        long count = registrationRepository.countByEventEventId(event.getEventId());
        boolean registered = userId != null && registrationRepository
                .existsByEventEventIdAndUserUserId(event.getEventId(), userId);
        return EventResponse.from(event, count, registered);
    }

    private Event requireEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> BusinessException.notFound("Sự kiện không tồn tại"));
    }

    private Event requireOwnedEvent(Long eventId, Long userId) {
        Event event = requireEvent(eventId);
        if (!Objects.equals(event.getOrganizer().getUserId(), userId)) {
            throw BusinessException.forbidden("Bạn không có quyền thao tác với sự kiện này");
        }
        return event;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.unauthorized("Người dùng không tồn tại"));
    }

    private User requireOrganizer(Long userId) {
        User user = requireUser(userId);
        if (!ORGANIZER.equalsIgnoreCase(user.getRole())) {
            throw BusinessException.forbidden("Chỉ dành cho Người tổ chức sự kiện");
        }
        return user;
    }

    private void validateTimes(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw BusinessException.badRequest("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
    }

    private static <T> List<T> page(List<T> values, int page, int pageSize) {
        int from = Math.min((page - 1) * pageSize, values.size());
        int to = Math.min(from + pageSize, values.size());
        return values.subList(from, to);
    }

    private static long countStatus(List<Event> events, String status) {
        return events.stream().filter(event -> status.equals(event.getStatus())).count();
    }

    private static double average(List<EventFeedback> feedback) {
        if (feedback.isEmpty()) return 0.0;
        return round(feedback.stream().mapToInt(EventFeedback::getRating).average().orElse(0.0), 2);
    }

    private static double round(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP).doubleValue();
    }
}
