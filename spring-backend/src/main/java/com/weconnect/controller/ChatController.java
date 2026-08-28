package com.weconnect.controller;

import com.weconnect.domain.chat.MessageDirection;
import com.weconnect.dto.chat.request.CreateConversationRequest;
import com.weconnect.dto.chat.request.MarkConversationReadRequest;
import com.weconnect.dto.chat.request.SendMessageRequest;
import com.weconnect.dto.chat.request.TypingRequest;
import com.weconnect.dto.chat.response.ChatMessageResponse;
import com.weconnect.dto.chat.response.ConversationListResponse;
import com.weconnect.dto.chat.response.ConversationResponse;
import com.weconnect.dto.chat.response.MessageListResponse;
import com.weconnect.dto.common.response.DataResponse;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/conversations")
@Validated
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public ConversationListResponse listConversations(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return chatService.listConversations(principal.getUser().getUserId(), page, pageSize);
    }

    @PostMapping
    public ResponseEntity<DataResponse<ConversationResponse>> createOrGetConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        ConversationResponse response = chatService.createOrGetConversation(
                principal.getUser().getUserId(),
                request.receiverId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(response));
    }

    @GetMapping("/{conversationId}/messages")
    public MessageListResponse listMessages(
            @PathVariable @Positive Long conversationId,
            @RequestParam(required = false) @Positive Long cursor,
            @RequestParam(defaultValue = "30") @Min(1) @Max(100) int limit,
            @RequestParam(defaultValue = "before") String direction,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return chatService.listMessages(
                principal.getUser().getUserId(),
                conversationId,
                cursor,
                limit,
                MessageDirection.from(direction)
        );
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<DataResponse<ChatMessageResponse>> sendMessage(
            @PathVariable @Positive Long conversationId,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        ChatMessageResponse response = chatService.sendMessage(
                principal.getUser().getUserId(),
                conversationId,
                request.content(),
                request.normalizedType()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(response));
    }

    @PostMapping(value = "/{conversationId}/attachments", consumes = "multipart/form-data")
    public ResponseEntity<DataResponse<ChatMessageResponse>> sendAttachment(
            @PathVariable @Positive Long conversationId,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        ChatMessageResponse response = chatService.sendAttachment(
                principal.getUser().getUserId(),
                conversationId,
                file
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(response));
    }

    @PostMapping("/{conversationId}/read")
    public ResponseEntity<Void> markConversationRead(
            @PathVariable @Positive Long conversationId,
            @Valid @RequestBody MarkConversationReadRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        chatService.markConversationRead(
                principal.getUser().getUserId(),
                conversationId,
                request.lastReadMessageId()
        );
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{conversationId}/typing")
    public ResponseEntity<Void> sendTypingStatus(
            @PathVariable @Positive Long conversationId,
            @Valid @RequestBody TypingRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        chatService.sendTypingStatus(
                principal.getUser().getUserId(),
                conversationId,
                request.isTyping()
        );
        return ResponseEntity.noContent().build();
    }
}
