package com.weconnect.controller;

import com.weconnect.dto.call.request.CreateCallRequest;
import com.weconnect.dto.call.response.CallConnectionResponse;
import com.weconnect.dto.call.response.CallResponse;
import com.weconnect.dto.call.response.IncomingCallResponse;
import com.weconnect.dto.common.response.DataResponse;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.CallService;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/calls")
@Validated
public class CallController {
    private final CallService callService;

    public CallController(CallService callService) {
        this.callService = callService;
    }

    @PostMapping
    public ResponseEntity<DataResponse<CallResponse>> createCall(
            @Valid @RequestBody CreateCallRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        CallResponse response = callService.createCall(
                principal.getUser().getUserId(), request.calleeId(), request.normalizedType()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(new DataResponse<>(response));
    }

    @GetMapping("/incoming/active")
    public DataResponse<IncomingCallResponse> activeIncoming(
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.getActiveIncomingCall(principal.getUser().getUserId()));
    }

    @GetMapping("/{callId}")
    public DataResponse<CallResponse> getCall(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.getCall(principal.getUser().getUserId(), callId));
    }

    @PostMapping("/{callId}/accept")
    public DataResponse<CallResponse> accept(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.acceptCall(principal.getUser().getUserId(), callId));
    }

    @PostMapping("/{callId}/reject")
    public DataResponse<CallResponse> reject(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.rejectCall(principal.getUser().getUserId(), callId));
    }

    @PostMapping("/{callId}/cancel")
    public DataResponse<CallResponse> cancel(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.cancelCall(principal.getUser().getUserId(), callId));
    }

    @PostMapping("/{callId}/timeout")
    public DataResponse<CallResponse> timeout(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.timeoutCall(principal.getUser().getUserId(), callId));
    }

    @PostMapping("/{callId}/end")
    public DataResponse<CallResponse> end(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.endCall(principal.getUser().getUserId(), callId));
    }

    @PostMapping("/{callId}/join")
    public DataResponse<CallConnectionResponse> join(
            @PathVariable @Positive Long callId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return new DataResponse<>(callService.joinCall(principal.getUser().getUserId(), callId));
    }
}
