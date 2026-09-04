package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EventStatisticsResponse(
        @JsonProperty("event_id") Long eventId,
        String title,
        @JsonProperty("total_registrations") long totalRegistrations,
        Integer capacity,
        @JsonProperty("registration_rate") double registrationRate,
        @JsonProperty("average_rating") double averageRating,
        @JsonProperty("feedback_count") long feedbackCount,
        @JsonProperty("rating_distribution") RatingDistributionResponse ratingDistribution
) {
    public record RatingDistributionResponse(
            int one, int two, int three, int four, int five
    ) {
    }
}
