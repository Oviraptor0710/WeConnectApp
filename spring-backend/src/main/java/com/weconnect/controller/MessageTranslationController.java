package com.weconnect.controller;

import com.weconnect.dto.common.response.DataResponse;
import com.weconnect.dto.translation.response.MessageTranslationResponse;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.TranslationService;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/messages")
@Validated
public class MessageTranslationController {
    private final TranslationService translationService;

    public MessageTranslationController(TranslationService translationService) {
        this.translationService = translationService;
    }

    @PostMapping("/{messageId}/translate")
    public DataResponse<MessageTranslationResponse> translate(
            @PathVariable @Positive Long messageId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(translationService.translateMessage(
                principal.getUser().getUserId(),
                messageId
        ));
    }
}
