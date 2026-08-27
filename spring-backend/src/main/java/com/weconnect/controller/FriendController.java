package com.weconnect.controller;

import com.weconnect.dto.common.response.DataResponse;
import com.weconnect.dto.friend.request.SendFriendRequestRequest;
import com.weconnect.dto.friend.response.AcceptFriendRequestResponse;
import com.weconnect.dto.friend.response.FriendListResponse;
import com.weconnect.dto.friend.response.FriendRequestListResponse;
import com.weconnect.dto.friend.response.FriendRequestResponse;
import com.weconnect.dto.friend.response.FriendRequestStatusResponse;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.FriendService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Validated
public class FriendController {
    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    @PostMapping("/friend-requests")
    public ResponseEntity<DataResponse<FriendRequestResponse>> sendFriendRequest(
            @Valid @RequestBody SendFriendRequestRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        FriendRequestResponse response = friendService.sendFriendRequest(
                principal.getUser().getUserId(),
                request.receiverId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(response));
    }

    @GetMapping("/friend-requests/received")
    public FriendRequestListResponse getReceivedRequests(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return friendService.getReceivedRequests(principal.getUser().getUserId(), page, pageSize);
    }

    @GetMapping("/friend-requests/sent")
    public FriendRequestListResponse getSentRequests(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return friendService.getSentRequests(principal.getUser().getUserId(), page, pageSize);
    }

    @DeleteMapping("/friend-requests/{requestId}")
    public ResponseEntity<Void> cancelFriendRequest(
            @PathVariable @Positive Long requestId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        friendService.cancelFriendRequest(requestId, principal.getUser().getUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/friend-requests/{requestId}/accept")
    public DataResponse<AcceptFriendRequestResponse> acceptFriendRequest(
            @PathVariable @Positive Long requestId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(
                friendService.acceptFriendRequest(requestId, principal.getUser().getUserId())
        );
    }

    @PostMapping("/friend-requests/{requestId}/reject")
    public DataResponse<FriendRequestStatusResponse> rejectFriendRequest(
            @PathVariable @Positive Long requestId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(
                friendService.rejectFriendRequest(requestId, principal.getUser().getUserId())
        );
    }

    @GetMapping("/friends")
    public FriendListResponse listFriends(
            @RequestParam(required = false, name = "q") String keyword,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20", name = "page_size") @Min(1) @Max(100) int pageSize,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return friendService.listFriends(
                principal.getUser().getUserId(),
                keyword,
                page,
                pageSize
        );
    }

    @DeleteMapping("/friends/{userId}")
    public ResponseEntity<Void> unfriend(
            @PathVariable @Positive Long userId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        friendService.unfriend(principal.getUser().getUserId(), userId);
        return ResponseEntity.noContent().build();
    }
}
