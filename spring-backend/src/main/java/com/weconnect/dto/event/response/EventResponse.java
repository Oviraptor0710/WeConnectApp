package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.Event;

import java.time.LocalDateTime;

public record EventResponse(
        @JsonProperty("event_id") Long eventId,
        String title,
        String category,
        String description,
        @JsonProperty("start_time") LocalDateTime startTime,
        @JsonProperty("end_time") LocalDateTime endTime,
        String location,
        Integer capacity,
        @JsonProperty("image_url") String imageUrl,
        String status,
        @JsonProperty("registered_count") long registeredCount,
        @JsonProperty("is_full") boolean isFull,
        @JsonProperty("is_registered") boolean isRegistered,
        OrganizerResponse organizer
) {
    public static EventResponse from(Event event, long registeredCount, boolean registered) {
        return new EventResponse(
                event.getEventId(), event.getTitle(), event.getCategory(), event.getDescription(),
                event.getStartTime(), event.getEndTime(), event.getLocation(), event.getCapacity(),
                event.getImageUrl(), event.getStatus(), registeredCount,
                registeredCount >= event.getCapacity(), registered,
                OrganizerResponse.from(event.getOrganizer())
        );
    }
}
