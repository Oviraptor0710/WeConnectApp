package com.weconnect.dto.chat.response;

import com.weconnect.dto.common.response.PaginationResponse;

import java.util.List;

public record ConversationListResponse(
        List<ConversationResponse> data,
        PaginationResponse pagination
) {
}
