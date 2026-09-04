package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EventOverviewResponse(
        @JsonProperty("total_events") long totalEvents,
        @JsonProperty("upcoming_events") long upcomingEvents,
        @JsonProperty("ongoing_events") long ongoingEvents,
        @JsonProperty("finished_events") long finishedEvents,
        @JsonProperty("total_registrations") long totalRegistrations,
        @JsonProperty("average_satisfaction") double averageSatisfaction
) {
}
