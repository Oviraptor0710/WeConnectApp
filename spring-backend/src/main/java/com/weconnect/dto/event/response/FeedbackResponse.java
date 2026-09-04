package com.weconnect.dto.event.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.EventFeedback;

import java.time.LocalDateTime;

public record FeedbackResponse(
        @JsonProperty("feedback_id") Long feedbackId,
        Integer rating,
        String comment,
        OrganizerResponse user,
        @JsonProperty("created_at") LocalDateTime createdAt
) {
    public static FeedbackResponse from(EventFeedback feedback) {
        return new FeedbackResponse(
                feedback.getFeedbackId(), feedback.getRating(), feedback.getComment(),
                OrganizerResponse.from(feedback.getUser()), feedback.getCreatedAt()
        );
    }
}
