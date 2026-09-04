package com.weconnect.dto.game.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weconnect.entity.Game;

public record GameResponse(
        @JsonProperty("game_id") String gameId,
        String name,
        String description,
        @JsonProperty("game_type") String gameType,
        @JsonProperty("icon_bg") String iconBg,
        @JsonProperty("badge_bg") String badgeBg,
        @JsonProperty("badge_text") String badgeText
) {
    public static GameResponse from(Game game) {
        return new GameResponse(game.getGameId(), game.getName(), game.getDescription(), game.getGameType(),
                game.getIconBg(), game.getBadgeBg(), game.getBadgeText());
    }
}
