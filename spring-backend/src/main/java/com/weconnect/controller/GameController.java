package com.weconnect.controller;

import com.weconnect.dto.game.request.AnswerRequest;
import com.weconnect.dto.game.request.CreateGameRoomRequest;
import com.weconnect.dto.game.request.GameMessageRequest;
import com.weconnect.dto.game.request.JoinGameRoomRequest;
import com.weconnect.dto.game.request.ScoreUpdateRequest;
import com.weconnect.dto.game.request.ShiritoriSubmitRequest;
import com.weconnect.dto.game.response.AnswerResponse;
import com.weconnect.dto.game.response.GameMessageResponse;
import com.weconnect.dto.game.response.GameResponse;
import com.weconnect.dto.game.response.GameRoomResponse;
import com.weconnect.dto.game.response.GameStateResponse;
import com.weconnect.dto.game.response.ShiritoriStateResponse;
import com.weconnect.dto.game.response.ShiritoriSubmitResponse;
import com.weconnect.security.CustomUserDetails;
import com.weconnect.service.GameService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/games")
@Validated
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping
    public List<GameResponse> games() {
        return gameService.listGames();
    }

    @GetMapping("/rooms")
    public List<GameRoomResponse> rooms(@RequestParam(required = false, name = "room_type") String roomType) {
        return gameService.listRooms(roomType);
    }

    @GetMapping("/rooms/code/{code}")
    public GameRoomResponse roomByCode(@PathVariable String code) {
        return gameService.roomByCode(code);
    }

    @PostMapping("/rooms")
    public ResponseEntity<GameRoomResponse> createRoom(
            @Valid @RequestBody CreateGameRoomRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gameService.createRoom(principal.getUser().getUserId(), request));
    }

    @PostMapping("/rooms/join")
    public GameRoomResponse joinRoom(
            @Valid @RequestBody JoinGameRoomRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.joinRoom(principal.getUser().getUserId(), request);
    }

    @PostMapping("/rooms/random")
    public GameRoomResponse joinRandom(
            @Valid @RequestBody CreateGameRoomRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.joinRandomRoom(principal.getUser().getUserId(), request);
    }

    @PostMapping("/rooms/{roomId}/leave")
    public Map<String, Object> leave(
            @PathVariable @Positive Long roomId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.leaveRoom(roomId, principal.getUser().getUserId());
    }

    @PutMapping("/rooms/{roomId}/score")
    public Map<String, Object> score(
            @PathVariable @Positive Long roomId,
            @RequestBody ScoreUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.updateScore(roomId, principal.getUser().getUserId(), request);
    }

    @PostMapping("/rooms/{roomId}/start")
    public Map<String, Object> start(
            @PathVariable @Positive Long roomId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.startRoom(roomId, principal.getUser().getUserId());
    }

    @GetMapping("/rooms/{roomId}/state")
    public GameStateResponse state(
            @PathVariable @Positive Long roomId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.state(roomId, principal.getUser().getUserId());
    }

    @PostMapping("/rooms/{roomId}/answer")
    public AnswerResponse answer(
            @PathVariable @Positive Long roomId,
            @Valid @RequestBody AnswerRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.answer(roomId, principal.getUser().getUserId(), request);
    }

    @GetMapping("/rooms/{roomId}/questions/{index}/answer")
    public Map<String, Object> reveal(
            @PathVariable @Positive Long roomId,
            @PathVariable int index
    ) {
        return gameService.revealAnswer(roomId, index);
    }

    @GetMapping("/rooms/{roomId}/messages")
    public List<GameMessageResponse> messages(@PathVariable @Positive Long roomId) {
        return gameService.listMessages(roomId);
    }

    @PostMapping("/rooms/{roomId}/messages")
    public GameMessageResponse sendMessage(
            @PathVariable @Positive Long roomId,
            @Valid @RequestBody GameMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.sendMessage(roomId, principal.getUser().getUserId(), request);
    }

    @PostMapping("/rooms/{roomId}/ready")
    public Map<String, Object> ready(
            @PathVariable @Positive Long roomId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.toggleReady(roomId, principal.getUser().getUserId());
    }

    @PostMapping("/rooms/{roomId}/pause")
    public Map<String, Object> pause(@PathVariable @Positive Long roomId, @AuthenticationPrincipal CustomUserDetails principal) {
        return gameService.pause(roomId, principal.getUser().getUserId());
    }

    @PostMapping("/rooms/{roomId}/resume")
    public Map<String, Object> resume(@PathVariable @Positive Long roomId, @AuthenticationPrincipal CustomUserDetails principal) {
        return gameService.resume(roomId, principal.getUser().getUserId());
    }

    @PostMapping("/rooms/{roomId}/end")
    public Map<String, Object> end(@PathVariable @Positive Long roomId, @AuthenticationPrincipal CustomUserDetails principal) {
        return gameService.end(roomId, principal.getUser().getUserId());
    }

    @GetMapping("/rooms/{roomId}/shiritori/state")
    public ShiritoriStateResponse shiritoriState(@PathVariable @Positive Long roomId, @AuthenticationPrincipal CustomUserDetails principal) {
        return gameService.shiritoriState(roomId, principal.getUser().getUserId());
    }

    @PostMapping("/rooms/{roomId}/shiritori/submit")
    public ShiritoriSubmitResponse shiritoriSubmit(
            @PathVariable @Positive Long roomId,
            @Valid @RequestBody ShiritoriSubmitRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        return gameService.submitShiritori(roomId, principal.getUser().getUserId(), request);
    }

    @PostMapping("/rooms/{roomId}/shiritori/skip")
    public Map<String, Object> shiritoriSkip(@PathVariable @Positive Long roomId, @AuthenticationPrincipal CustomUserDetails principal) {
        return gameService.skipShiritori(roomId, principal.getUser().getUserId());
    }
}
