package com.weconnect.controller;

import com.weconnect.dto.common.response.DataResponse;
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
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.EventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@Validated
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<EventResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.listEvents(q, status, page, pageSize, principal.getUser().getUserId());
    }

    @GetMapping("/managed")
    public List<EventResponse> managed(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.listManagedEvents(principal.getUser().getUserId(), page, pageSize);
    }

    @GetMapping("/statistics/overview")
    public EventOverviewResponse overview(@AuthenticationPrincipal CustomUserDetails principal) {
        return eventService.overview(principal.getUser().getUserId());
    }

    @GetMapping("/{eventId}")
    public EventResponse get(
            @PathVariable @Positive Long eventId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.getEvent(eventId, principal.getUser().getUserId());
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(
            @Valid @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.create(principal.getUser().getUserId(), request));
    }

    @PutMapping("/{eventId}")
    public EventResponse update(
            @PathVariable @Positive Long eventId,
            @Valid @RequestBody UpdateEventRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.update(eventId, principal.getUser().getUserId(), request);
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> delete(
            @PathVariable @Positive Long eventId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        eventService.delete(eventId, principal.getUser().getUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public EventImageResponse uploadImage(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.uploadImage(principal.getUser().getUserId(), file);
    }

    @PostMapping("/{eventId}/register")
    public ResponseEntity<DataResponse<RegistrationResponse>> register(
            @PathVariable @Positive Long eventId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(
                eventService.register(eventId, principal.getUser().getUserId())
        ));
    }

    @DeleteMapping("/{eventId}/register")
    public ResponseEntity<Void> cancelRegistration(
            @PathVariable @Positive Long eventId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        eventService.cancelRegistration(eventId, principal.getUser().getUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{eventId}/feedback")
    public List<FeedbackResponse> feedback(
            @PathVariable @Positive Long eventId,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize
    ) {
        return eventService.listFeedback(eventId, page, pageSize);
    }

    @PostMapping("/{eventId}/feedback")
    public ResponseEntity<DataResponse<Map<String, Object>>> createFeedback(
            @PathVariable @Positive Long eventId,
            @Valid @RequestBody CreateFeedbackRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(
                eventService.createFeedback(eventId, principal.getUser().getUserId(), request)
        ));
    }

    @GetMapping("/{eventId}/statistics")
    public EventStatisticsResponse statistics(
            @PathVariable @Positive Long eventId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.statistics(eventId, principal.getUser().getUserId());
    }

    @GetMapping("/{eventId}/participants")
    public List<ParticipantResponse> participants(
            @PathVariable @Positive Long eventId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return eventService.participants(eventId, principal.getUser().getUserId());
    }
}
