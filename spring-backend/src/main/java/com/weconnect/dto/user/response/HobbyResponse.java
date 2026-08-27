package com.weconnect.dto.user.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.Hobby;

public record HobbyResponse(
        @JsonProperty("hobby_id") Integer hobbyId,
        String name,
        String category
) {
    public static HobbyResponse from(Hobby hobby) {
        return new HobbyResponse(hobby.getHobbyId(), hobby.getName(), hobby.getCategory());
    }
}
