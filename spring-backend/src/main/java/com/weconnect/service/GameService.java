package com.weconnect.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.weconnect.dto.game.response.LeaderboardEntryResponse;
import com.weconnect.dto.game.response.QuestionResponse;
import com.weconnect.dto.game.response.ShiritoriStateResponse;
import com.weconnect.dto.game.response.ShiritoriSubmitResponse;
import com.weconnect.entity.Game;
import com.weconnect.entity.GameAnswer;
import com.weconnect.entity.GameMessage;
import com.weconnect.entity.GameParticipant;
import com.weconnect.entity.GameQuestion;
import com.weconnect.entity.GameRoom;
import com.weconnect.entity.GameWord;
import com.weconnect.entity.User;
import com.weconnect.exception.BusinessException;
import com.weconnect.realtime.RealtimeEvent;
import com.weconnect.repository.GameAnswerRepository;
import com.weconnect.repository.GameMessageRepository;
import com.weconnect.repository.GameParticipantRepository;
import com.weconnect.repository.GameQuestionRepository;
import com.weconnect.repository.GameRepository;
import com.weconnect.repository.GameRoomRepository;
import com.weconnect.repository.GameWordRepository;
import com.weconnect.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GameService {
    private static final int ANSWER_WINDOW_SECONDS = 10;
    private static final int REVEAL_SECONDS = 3;
    private static final int CYCLE_SECONDS = ANSWER_WINDOW_SECONDS + REVEAL_SECONDS;
    private static final int TOTAL_QUESTIONS = 10;
    private static final int BASE_POINTS = 10;
    private static final int MATCH_SECONDS = CYCLE_SECONDS * TOTAL_QUESTIONS;
    private static final int MIN_TURN_SECONDS = 5;
    private static final int MAX_TURN_SECONDS = 300;
    private static final int MIN_MATCH_MINUTES = 1;
    private static final int MAX_MATCH_MINUTES = 120;

    private final ObjectMapper objectMapper;
    private final GameRepository gameRepository;
    private final GameRoomRepository roomRepository;
    private final GameParticipantRepository participantRepository;
    private final GameMessageRepository messageRepository;
    private final GameQuestionRepository questionRepository;
    private final GameAnswerRepository answerRepository;
    private final GameWordRepository wordRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public GameService(
            ObjectMapper objectMapper,
            GameRepository gameRepository,
            GameRoomRepository roomRepository,
            GameParticipantRepository participantRepository,
            GameMessageRepository messageRepository,
            GameQuestionRepository questionRepository,
            GameAnswerRepository answerRepository,
            GameWordRepository wordRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher
    ) {
        this.objectMapper = objectMapper;
        this.gameRepository = gameRepository;
        this.roomRepository = roomRepository;
        this.participantRepository = participantRepository;
        this.messageRepository = messageRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.wordRepository = wordRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional(readOnly = true)
    public List<GameResponse> listGames() {
        return gameRepository.findAll().stream().map(GameResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<GameRoomResponse> listRooms(String roomType) {
        List<GameRoom> rooms = roomRepository.findByStatusNotOrderByCreatedAtDesc("ENDED");
        if (roomType != null && !roomType.isBlank()) {
            String type = roomType.trim().toUpperCase(Locale.ROOT);
            rooms = rooms.stream().filter(room -> type.equals(room.getRoomType())).toList();
        }
        return rooms.stream().map(this::roomResponse).toList();
    }

    @Transactional(readOnly = true)
    public GameRoomResponse roomByCode(String code) {
        GameRoom room = roomRepository.findByCodeIgnoreCaseAndStatusNot(code, "ENDED")
                .orElseThrow(() -> BusinessException.notFound("Phòng game không tồn tại hoặc đã kết thúc"));
        return roomResponse(room);
    }

    @Transactional
    public GameRoomResponse createRoom(Long userId, CreateGameRoomRequest request) {
        User host = requireUser(userId);
        String roomType = request.normalizedRoomType();
        int maxPlayers = request.normalizedMaxPlayers();
        if (maxPlayers < 1) throw BusinessException.badRequest("Số người chơi phải lớn hơn 0");
        Map<String, Object> settings = roomType.equals("SHIRITORI")
                ? normalizeShiritoriSettings(request.settings()) : null;
        if (roomType.equals("SHIRITORI") && wordRepository.findByMoraCountBetween(
                intSetting(settings, "min_mora"), intSetting(settings, "max_mora")).isEmpty()) {
            throw BusinessException.badRequest("Không có từ phù hợp với cấu hình phòng");
        }
        GameRoom room = new GameRoom();
        room.setCode(uniqueCode());
        room.setHost(host);
        room.setRoomType(roomType);
        room.setMaxPlayers(maxPlayers);
        room.setStatus("WAITING");
        room.setRoomSettings(toJson(settings));
        room = roomRepository.save(room);
        joinParticipant(room, host);
        return roomResponse(room);
    }

    @Transactional
    public GameRoomResponse joinRoom(Long userId, JoinGameRoomRequest request) {
        User user = requireUser(userId);
        GameRoom room = roomRepository.findByCodeIgnoreCaseAndStatusNot(request.code(), "ENDED")
                .orElseThrow(() -> BusinessException.notFound("Phòng game không tồn tại hoặc đã kết thúc"));
        if (participantRepository.findByRoomRoomIdAndUserUserIdAndLeftAtIsNull(room.getRoomId(), userId).isPresent()) {
            return roomResponse(room);
        }
        if (participantRepository.countByRoomRoomIdAndLeftAtIsNull(room.getRoomId()) >= room.getMaxPlayers()) {
            throw BusinessException.badRequest("Phòng game đã đầy");
        }
        joinParticipant(room, user);
        publish(room, "game:player-joined", Map.of("user_id", userId));
        return roomResponse(room);
    }

    @Transactional
    public GameRoomResponse joinRandomRoom(Long userId, CreateGameRoomRequest request) {
        User user = requireUser(userId);
        String type = request.normalizedRoomType();
        for (GameRoom candidate : roomRepository.findByRoomTypeAndStatusOrderByCreatedAtAsc(type, "WAITING")) {
            if (participantRepository.countByRoomRoomIdAndLeftAtIsNull(candidate.getRoomId()) < candidate.getMaxPlayers()) {
                if (participantRepository.findByRoomRoomIdAndUserUserIdAndLeftAtIsNull(candidate.getRoomId(), userId).isEmpty()) {
                    joinParticipant(candidate, user);
                }
                return roomResponse(candidate);
            }
        }
        return createRoom(userId, request);
    }

    @Transactional
    public Map<String, Object> leaveRoom(Long roomId, Long userId) {
        GameRoom room = requireRoom(roomId);
        participantRepository.findByRoomRoomIdAndUserUserIdAndLeftAtIsNull(roomId, userId).ifPresent(participant -> {
            participant.setLeftAt(LocalDateTime.now());
            participantRepository.save(participant);
        });
        List<GameParticipant> active = participantRepository.findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(roomId);
        if (active.isEmpty()) {
            room.setStatus("ENDED");
            room.setEndedAt(LocalDateTime.now());
        } else if (Objects.equals(room.getHost().getUserId(), userId)) {
            room.setHost(active.get(0).getUser());
        }
        roomRepository.save(room);
        publish(room, "game:player-left", Map.of("user_id", userId));
        return Map.of("status", "ok", "message", "Đã rời khỏi phòng thành công");
    }

    @Transactional
    public Map<String, Object> updateScore(Long roomId, Long userId, ScoreUpdateRequest request) {
        GameParticipant participant = activeParticipant(roomId, userId);
        participant.setScore(request.score());
        participantRepository.save(participant);
        return Map.of("status", "ok", "score", participant.getScore());
    }

    @Transactional
    public Map<String, Object> startRoom(Long roomId, Long userId) {
        GameRoom room = requireHost(roomId, userId);
        if (!"WAITING".equals(room.getStatus())) throw BusinessException.badRequest("Phòng game đã bắt đầu hoặc đã kết thúc");
        if ("SHIRITORI".equals(room.getRoomType())) {
            Map<String, Object> settings = shiritoriSettings(room);
            List<GameWord> pool = wordRepository.findByMoraCountBetween(intSetting(settings, "min_mora"), intSetting(settings, "max_mora"));
            if (pool.isEmpty()) throw BusinessException.badRequest("Không có từ nào phù hợp cấu hình phòng");
            String configuredStart = string(settings.get("start_kana"));
            GameWord starter = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
            String requiredKana = configuredStart.isBlank() || "RANDOM".equalsIgnoreCase(configuredStart)
                    ? starter.getFirstKana() : configuredStart.substring(0, 1);
            Map<String, Object> state = new LinkedHashMap<>();
            state.put("required_kana", requiredKana);
            List<GameParticipant> participants = participantRepository.findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(roomId);
            state.put("current_turn_user_id", participants.isEmpty() ? room.getHost().getUserId() : participants.get(0).getUser().getUserId());
            state.put("turn_started_at", LocalDateTime.now().toString());
            state.put("used_words", new ArrayList<>());
            state.put("history", new ArrayList<>());
            room.setGameState(toJson(state));
        } else {
            List<Long> ids = questionRepository.findByGameType(room.getRoomType()).stream().map(GameQuestion::getQuestionId).toList();
            if (ids.isEmpty()) throw BusinessException.badRequest("Chưa có câu hỏi cho loại game này");
            List<Long> shuffled = new ArrayList<>(ids);
            Collections.shuffle(shuffled);
            List<Long> chosen = new ArrayList<>();
            for (int i = 0; i < TOTAL_QUESTIONS; i++) chosen.add(shuffled.get(i % shuffled.size()));
            room.setQuestionIds(toJson(chosen));
        }
        LocalDateTime now = LocalDateTime.now();
        room.setStatus("PLAYING");
        room.setStartedAt(now);
        room.setPausedAt(null);
        room.setEndedAt(null);
        roomRepository.save(room);
        publish(room, "game:started", Map.of("room_id", roomId, "started_at", now));
        if ("SHIRITORI".equals(room.getRoomType())) publishShiritoriTurn(room);
        return Map.of("status", "ok", "message", "Trận đấu đã bắt đầu thành công");
    }

    @Transactional
    public GameStateResponse state(Long roomId, Long userId) {
        GameRoom room = requireRoom(roomId);
        LocalDateTime now = LocalDateTime.now();
        int elapsed = elapsed(room, now);
        if ("PLAYING".equals(room.getStatus()) && room.getStartedAt() != null && elapsed >= MATCH_SECONDS && room.getEndedAt() == null) {
            room.setStatus("ENDED"); room.setEndedAt(now); roomRepository.save(room);
            publish(room, "game:ended", Map.of("room_id", roomId, "leaderboard", leaderboard(roomId)));
        }
        List<Integer> myAnswers = answerRepository.findByRoomRoomIdAndUserUserId(roomId, userId).stream()
                .map(GameAnswer::getQuestionIndex).toList();
        int current = "PLAYING".equals(room.getStatus()) ? Math.min(TOTAL_QUESTIONS - 1, elapsed / CYCLE_SECONDS) : 0;
        return new GameStateResponse(roomId, room.getCode(), room.getStatus(), room.getHost().getUserId(), room.getStartedAt(), room.getPausedAt(), now,
                TOTAL_QUESTIONS, CYCLE_SECONDS, ANSWER_WINDOW_SECONDS, current,
                visibleQuestions(room, elapsed), myAnswers, leaderboard(roomId));
    }

    @Transactional
    public AnswerResponse answer(Long roomId, Long userId, AnswerRequest request) {
        GameRoom room = requireRoom(roomId);
        if (!"PLAYING".equals(room.getStatus()) || room.getPausedAt() != null || room.getStartedAt() == null) {
            throw BusinessException.badRequest("Trận đấu không trong trạng thái nhận câu trả lời");
        }
        GameParticipant participant = activeParticipant(roomId, userId);
        int elapsed = elapsed(room, LocalDateTime.now());
        int current = elapsed / CYCLE_SECONDS;
        if (request.questionIndex() != current) throw BusinessException.conflict("Câu hỏi đã chuyển sang câu khác");
        if (elapsed % CYCLE_SECONDS >= ANSWER_WINDOW_SECONDS) throw BusinessException.conflict("Đã hết thời gian trả lời câu này");
        List<Long> ids = longList(room.getQuestionIds());
        if (current < 0 || current >= ids.size()) throw BusinessException.notFound("Câu hỏi không tồn tại");
        GameQuestion question = questionRepository.findById(ids.get(current)).orElseThrow(() -> BusinessException.notFound("Câu hỏi không tồn tại"));
        if (answerRepository.existsByRoomRoomIdAndUserUserIdAndQuestionIndex(roomId, userId, current)) {
            throw BusinessException.conflict("Bạn đã trả lời câu này rồi");
        }
        boolean correct = request.selectedIndex() == question.getCorrectIndex();
        int points = correct ? BASE_POINTS + (ANSWER_WINDOW_SECONDS - elapsed % CYCLE_SECONDS) : 0;
        GameAnswer answer = new GameAnswer();
        answer.setRoom(room); answer.setUser(participant.getUser()); answer.setQuestionIndex(current);
        answer.setSelectedIndex(request.selectedIndex()); answer.setIsCorrect(correct); answer.setPoints(points);
        answerRepository.save(answer);
        participant.setScore((participant.getScore() == null ? 0 : participant.getScore()) + points);
        participantRepository.save(participant);
        publish(room, "game:score", Map.of("user_id", userId, "question_index", current, "leaderboard", leaderboard(roomId)));
        return new AnswerResponse(correct, question.getCorrectIndex(), points, participant.getScore());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> revealAnswer(Long roomId, int index) {
        GameRoom room = requireRoom(roomId);
        int elapsed = elapsed(room, LocalDateTime.now());
        int current = elapsed / CYCLE_SECONDS;
        if (!(index < current || (index == current && elapsed % CYCLE_SECONDS >= ANSWER_WINDOW_SECONDS))) {
            throw BusinessException.conflict("Chưa đến lúc công bố đáp án");
        }
        List<Long> ids = longList(room.getQuestionIds());
        if (index < 0 || index >= ids.size()) throw BusinessException.notFound("Câu hỏi không tồn tại");
        GameQuestion question = questionRepository.findById(ids.get(index)).orElseThrow(() -> BusinessException.notFound("Câu hỏi không tồn tại"));
        return Map.of("question_index", index, "correct_index", question.getCorrectIndex());
    }

    @Transactional(readOnly = true)
    public List<GameMessageResponse> listMessages(Long roomId) {
        requireRoom(roomId);
        List<GameMessage> messages = new ArrayList<>(messageRepository.findTop50ByRoomRoomIdOrderByMessageIdDesc(roomId));
        Collections.reverse(messages);
        return messages.stream().map(GameMessageResponse::from).toList();
    }

    @Transactional
    public GameMessageResponse sendMessage(Long roomId, Long userId, GameMessageRequest request) {
        GameRoom room = requireRoom(roomId);
        User user = requireUser(userId);
        String content = request.content() == null ? "" : request.content().trim();
        if (content.isEmpty()) throw BusinessException.badRequest("Nội dung tin nhắn trống");
        GameMessage message = new GameMessage(); message.setRoom(room); message.setSender(user); message.setContent(content);
        GameMessageResponse response = GameMessageResponse.from(messageRepository.save(message));
        publish(room, "game:message", response);
        return response;
    }

    @Transactional
    public Map<String, Object> toggleReady(Long roomId, Long userId) {
        GameParticipant participant = activeParticipant(roomId, userId);
        participant.setIsReady(!Boolean.TRUE.equals(participant.getIsReady()));
        participantRepository.save(participant);
        GameRoom room = requireRoom(roomId);
        publish(room, "game:ready", Map.of("user_id", userId, "is_ready", participant.getIsReady()));
        return Map.of("status", "ok", "is_ready", participant.getIsReady());
    }

    @Transactional
    public Map<String, Object> pause(Long roomId, Long userId) {
        GameRoom room = requireHost(roomId, userId);
        if (!"PLAYING".equals(room.getStatus()) || room.getPausedAt() != null) throw BusinessException.badRequest("Không thể tạm dừng lúc này");
        LocalDateTime now = LocalDateTime.now(); room.setPausedAt(now); roomRepository.save(room);
        publish(room, "game:paused", Map.of("paused_at", now)); return Map.of("status", "ok");
    }

    @Transactional
    public Map<String, Object> resume(Long roomId, Long userId) {
        GameRoom room = requireHost(roomId, userId);
        if (!"PLAYING".equals(room.getStatus()) || room.getPausedAt() == null || room.getStartedAt() == null) throw BusinessException.badRequest("Trận đấu không đang tạm dừng");
        LocalDateTime now = LocalDateTime.now();
        room.setStartedAt(room.getStartedAt().plus(Duration.between(room.getPausedAt(), now)));
        room.setPausedAt(null); roomRepository.save(room);
        publish(room, "game:resumed", Map.of("started_at", room.getStartedAt())); return Map.of("status", "ok");
    }

    @Transactional
    public Map<String, Object> end(Long roomId, Long userId) {
        GameRoom room = requireHost(roomId, userId);
        if (!"ENDED".equals(room.getStatus())) { room.setStatus("ENDED"); room.setEndedAt(LocalDateTime.now()); roomRepository.save(room); publish(room, "game:ended", Map.of("room_id", roomId, "leaderboard", leaderboard(roomId))); }
        return Map.of("status", "ok");
    }

    @Transactional
    public ShiritoriStateResponse shiritoriState(Long roomId, Long userId) {
        GameRoom room = requireRoom(roomId);
        if (!"SHIRITORI".equals(room.getRoomType())) throw BusinessException.badRequest("Phòng này không phải Shiritori");
        Map<String, Object> settings = shiritoriSettings(room); Map<String, Object> state = jsonMap(room.getGameState());
        LocalDateTime now = LocalDateTime.now();
        if ("PLAYING".equals(room.getStatus()) && room.getStartedAt() != null
                && secondsSince(room.getStartedAt(), now) >= intSetting(settings, "match_minutes") * 60) {
            room.setStatus("ENDED");
            room.setEndedAt(now);
            roomRepository.save(room);
            publish(room, "game:ended", Map.of("room_id", roomId, "leaderboard", leaderboard(roomId)));
        }
        LocalDateTime turnAt = parseDate(string(state.get("turn_started_at")));
        int turnSeconds = intSetting(settings, "turn_seconds"); int matchMinutes = intSetting(settings, "match_minutes");
        List<ShiritoriStateResponse.HistoryEntry> history = new ArrayList<>();
        for (Map<String, Object> h : mapList(state.get("history"))) history.add(new ShiritoriStateResponse.HistoryEntry(
                longValue(h.get("user_id")), string(h.get("full_name")), string(h.get("word")), string(h.get("meaning")), intValue(h.get("points")), parseDate(string(h.get("played_at")))));
        return new ShiritoriStateResponse(roomId, room.getCode(), room.getStatus(), room.getHost().getUserId(), room.getStartedAt(), room.getPausedAt(), room.getEndedAt(), now,
                settings, string(state.get("required_kana")), longValue(state.get("current_turn_user_id")), turnAt,
                room.getStatus().equals("PLAYING") ? Math.max(0, turnSeconds - secondsSince(turnAt, now)) : turnSeconds,
                room.getStatus().equals("PLAYING") ? Math.max(0, matchMinutes * 60 - secondsSince(room.getStartedAt(), now)) : matchMinutes * 60,
                stringList(state.get("used_words")), history, leaderboard(roomId), room.getStatus().equals("PLAYING") && Objects.equals(longValue(state.get("current_turn_user_id")), userId));
    }

    @Transactional
    public ShiritoriSubmitResponse submitShiritori(Long roomId, Long userId, ShiritoriSubmitRequest request) {
        GameRoom room = requireRoom(roomId);
        if (!"SHIRITORI".equals(room.getRoomType())) throw BusinessException.notFound("Phòng Shiritori không tồn tại");
        if (!"PLAYING".equals(room.getStatus()) || room.getPausedAt() != null) throw BusinessException.badRequest("Trận đấu không đang diễn ra");
        GameParticipant participant = activeParticipant(roomId, userId); Map<String, Object> settings = shiritoriSettings(room); Map<String, Object> state = jsonMap(room.getGameState());
        LocalDateTime now = LocalDateTime.now();
        if (room.getStartedAt() != null && secondsSince(room.getStartedAt(), now) >= intSetting(settings, "match_minutes") * 60) {
            room.setStatus("ENDED"); room.setEndedAt(now); roomRepository.save(room);
            publish(room, "game:ended", Map.of("room_id", roomId, "leaderboard", leaderboard(roomId)));
            throw BusinessException.conflict("Trận đấu đã kết thúc");
        }
        if (!Objects.equals(longValue(state.get("current_turn_user_id")), userId)) throw BusinessException.conflict("Chưa đến lượt của bạn");
        LocalDateTime turnAt = parseDate(string(state.get("turn_started_at")));
        if (secondsSince(turnAt, now) >= intSetting(settings, "turn_seconds")) { advanceTurn(room, state, now); throw BusinessException.conflict("Đã hết thời gian lượt này"); }
        String normalized = normalizeKana(request.word(), string(settings.get("script_mode")));
        List<String> used = stringList(state.get("used_words")); String required = string(state.get("required_kana"));
        if (normalized.isEmpty()) return invalidShiritori(room, userId, participant, "invalid_script", null);
        if (used.contains(normalized)) return invalidShiritori(room, userId, participant, "already_used", null);
        if (lastKana(normalized).equals("ん")) return invalidShiritori(room, userId, participant, "ends_with_n", null);
        if (!required.isBlank() && !normalized.startsWith(required)) return invalidShiritori(room, userId, participant, "wrong_start", Map.of("kana", required));
        int mora = moraCount(normalized); int min = intSetting(settings, "min_mora"); int max = intSetting(settings, "max_mora");
        if (mora < min || mora > max) return invalidShiritori(room, userId, participant, "wrong_length", Map.of("min", min, "max", max));
        GameWord word = wordRepository.findByHiragana(toHiragana(normalized)).orElse(null);
        if (word == null) return invalidShiritori(room, userId, participant, "not_in_bank", null);
        int points = 10 + Math.max(0, mora - 2) * 2 + Math.max(0, 10 - secondsSince(turnAt, now));
        participant.setScore(score(participant) + points); participantRepository.save(participant);
        used.add(normalized); state.put("used_words", used); String next = lastKana(normalized); state.put("required_kana", next);
        List<Map<String, Object>> history = mapList(state.get("history")); history.add(Map.of("user_id", userId, "full_name", participant.getUser().getFullName(), "word", normalized, "meaning", word.getMeaningVi(), "points", points, "played_at", now.toString())); state.put("history", history);
        advanceTurn(room, state, now); room.setGameState(toJson(state)); roomRepository.save(room);
        List<LeaderboardEntryResponse> leaderboard = leaderboard(roomId); publish(room, "game:shiritori-word", Map.of("user_id", userId, "word", normalized, "meaning", word.getMeaningVi(), "points", points, "next_kana", next, "leaderboard", leaderboard)); publishShiritoriTurn(room);
        return new ShiritoriSubmitResponse(true, null, null, normalized, word.getMeaningVi(), points, score(participant), next, longValue(state.get("current_turn_user_id")));
    }

    @Transactional
    public Map<String, Object> skipShiritori(Long roomId, Long userId) {
        GameRoom room = requireRoom(roomId); if (!"SHIRITORI".equals(room.getRoomType())) throw BusinessException.notFound("Phòng Shiritori không tồn tại");
        if (!"PLAYING".equals(room.getStatus())) throw BusinessException.badRequest("Trận đấu không đang diễn ra");
        Map<String, Object> state = jsonMap(room.getGameState());
        LocalDateTime now = LocalDateTime.now();
        if (room.getStartedAt() != null && secondsSince(room.getStartedAt(), now)
                >= intSetting(shiritoriSettings(room), "match_minutes") * 60) {
            room.setStatus("ENDED"); room.setEndedAt(now); roomRepository.save(room);
            publish(room, "game:ended", Map.of("room_id", roomId, "leaderboard", leaderboard(roomId)));
            return Map.of("status", "ended");
        }
        if (!Objects.equals(longValue(state.get("current_turn_user_id")), userId)) throw BusinessException.conflict("Chỉ người đang chơi mới bỏ lượt được");
        advanceTurn(room, state, LocalDateTime.now()); room.setGameState(toJson(state)); roomRepository.save(room); publishShiritoriTurn(room); return Map.of("status", "ok");
    }

    private GameRoom requireRoom(Long id) { return roomRepository.findById(id).orElseThrow(() -> BusinessException.notFound("Phòng game không tồn tại")); }
    private User requireUser(Long id) { return userRepository.findById(id).orElseThrow(() -> BusinessException.unauthorized("Người dùng không tồn tại")); }
    private GameParticipant activeParticipant(Long roomId, Long userId) { return participantRepository.findByRoomRoomIdAndUserUserIdAndLeftAtIsNull(roomId, userId).orElseThrow(() -> BusinessException.forbidden("Bạn không tham gia phòng này")); }
    private GameRoom requireHost(Long roomId, Long userId) { GameRoom room = requireRoom(roomId); if (!Objects.equals(room.getHost().getUserId(), userId)) throw BusinessException.forbidden("Chỉ chủ phòng mới có quyền này"); return room; }
    private void joinParticipant(GameRoom room, User user) { GameParticipant p = new GameParticipant(); p.setRoom(room); p.setUser(user); p.setScore(0); p.setIsReady(false); participantRepository.save(p); }
    private String uniqueCode() { String code; do { code = "RM" + String.format("%04d", ThreadLocalRandom.current().nextInt(10000)); } while (roomRepository.findByCodeIgnoreCaseAndStatusNot(code, "__NONE__").isPresent()); return code; }
    private GameRoomResponse roomResponse(GameRoom room) { List<GameRoomResponse.ParticipantResponse> participants = participantRepository.findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(room.getRoomId()).stream().map(GameRoomResponse.ParticipantResponse::from).toList(); return new GameRoomResponse(room.getRoomId(), room.getCode(), room.getHost().getUserId(), room.getRoomType(), room.getMaxPlayers(), room.getStatus(), room.getCreatedAt(), room.getStartedAt(), jsonMap(room.getRoomSettings()), participants.size(), participants); }
    private ShiritoriSubmitResponse invalidShiritori(GameRoom room, Long userId, GameParticipant participant, String reason, Map<String, Object> params) {
        publish(room, "game:shiritori-invalid", Map.of("user_id", userId, "reason", reason));
        return ShiritoriSubmitResponse.invalid(reason, params, score(participant));
    }
    private List<LeaderboardEntryResponse> leaderboard(Long roomId) { return participantRepository.findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(roomId).stream().map(p -> new LeaderboardEntryResponse(p.getUser().getUserId(), p.getUser().getFullName(), p.getUser().getAvatarUrl(), score(p), Boolean.TRUE.equals(p.getIsReady()))).sorted(Comparator.comparingInt(LeaderboardEntryResponse::score).reversed()).toList(); }
    private List<QuestionResponse> visibleQuestions(GameRoom room, int elapsed) { List<Long> ids = longList(room.getQuestionIds()); int current = Math.min(TOTAL_QUESTIONS - 1, elapsed / CYCLE_SECONDS); List<QuestionResponse> result = new ArrayList<>(); for (int i = 0; i <= current && i < ids.size(); i++) { int index = i; questionRepository.findById(ids.get(index)).ifPresent(q -> result.add(new QuestionResponse(index, q.getCategory(), q.getQuestion(), q.getDescription(), stringList(jsonNodeList(q.getOptions())), q.getHint(), (index < current || elapsed % CYCLE_SECONDS >= ANSWER_WINDOW_SECONDS) ? q.getCorrectIndex() : null))); } return result; }
    private List<Object> jsonNodeList(String json) { try { return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<Object>>() {}); } catch (Exception e) { return List.of(); } }
    private int elapsed(GameRoom room, LocalDateTime now) { if (room.getStartedAt() == null) return 0; return Math.max(0, secondsSince(room.getStartedAt(), room.getPausedAt() == null ? now : room.getPausedAt())); }
    private int secondsSince(LocalDateTime from, LocalDateTime to) { return from == null ? 0 : Math.max(0, (int) Duration.between(from, to).getSeconds()); }
    private void publish(GameRoom room, String event, Object data) {
        Map<String, Object> payload = objectMapper.convertValue(data, new TypeReference<LinkedHashMap<String, Object>>() {});
        payload.putIfAbsent("room_id", room.getRoomId());
        participantRepository.findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(room.getRoomId())
                .forEach(participant -> eventPublisher.publishEvent(new RealtimeEvent(
                        "private-user-" + participant.getUser().getUserId(), event, payload)));
    }
    private void publishShiritoriTurn(GameRoom room) { Map<String, Object> s = jsonMap(room.getGameState()); publish(room, "game:shiritori-turn", Map.of("current_turn_user_id", longValue(s.get("current_turn_user_id")), "required_kana", string(s.get("required_kana")), "turn_started_at", string(s.get("turn_started_at")))); }
    private void advanceTurn(GameRoom room, Map<String, Object> state, LocalDateTime now) { List<GameParticipant> ps = participantRepository.findByRoomRoomIdAndLeftAtIsNullOrderByJoinedAtAsc(room.getRoomId()); if (ps.isEmpty()) return; Long current = longValue(state.get("current_turn_user_id")); int idx = -1; for (int i = 0; i < ps.size(); i++) if (Objects.equals(ps.get(i).getUser().getUserId(), current)) idx = i; state.put("current_turn_user_id", ps.get((idx + 1) % ps.size()).getUser().getUserId()); state.put("turn_started_at", now.toString()); }
    private Map<String, Object> normalizeShiritoriSettings(Map<String, Object> raw) { Map<String, Object> s = new LinkedHashMap<>(); Map<String, Object> in = raw == null ? Map.of() : raw; String script = string(in.getOrDefault("script_mode", "HIRAGANA")).toUpperCase(Locale.ROOT); if (!script.equals("HIRAGANA") && !script.equals("KATAKANA")) throw BusinessException.badRequest("script_mode không hợp lệ"); int min = intValue(in.getOrDefault("min_mora", 2)), max = intValue(in.getOrDefault("max_mora", 8)), turn = intValue(in.getOrDefault("turn_seconds", 30)), match = intValue(in.getOrDefault("match_minutes", 10)); if (min < 1 || max < min || max > 12) throw BusinessException.badRequest("Khoảng mora không hợp lệ"); if (turn < MIN_TURN_SECONDS || turn > MAX_TURN_SECONDS || match < MIN_MATCH_MINUTES || match > MAX_MATCH_MINUTES) throw BusinessException.badRequest("Thời gian phòng không hợp lệ"); s.put("script_mode", script); s.put("min_mora", min); s.put("max_mora", max); s.put("start_kana", string(in.getOrDefault("start_kana", "RANDOM"))); s.put("turn_seconds", turn); s.put("match_minutes", match); s.put("allow_long_vowel_chain", Boolean.TRUE.equals(in.getOrDefault("allow_long_vowel_chain", true))); return s; }
    private Map<String, Object> shiritoriSettings(GameRoom room) { Map<String, Object> s = jsonMap(room.getRoomSettings()); return s.isEmpty() ? normalizeShiritoriSettings(null) : normalizeShiritoriSettings(s); }
    private String toJson(Object object) { if (object == null) return null; try { return objectMapper.writeValueAsString(object); } catch (Exception e) { throw new IllegalStateException("Không thể lưu trạng thái game", e); } }
    private Map<String, Object> jsonMap(String json) { if (json == null || json.isBlank()) return new LinkedHashMap<>(); try { return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {}); } catch (Exception e) { return new LinkedHashMap<>(); } }
    private List<Long> longList(String json) { try { return objectMapper.readValue(json == null ? "[]" : json, new TypeReference<List<Long>>() {}); } catch (Exception e) { return new ArrayList<>(); } }
    private List<String> stringList(Object value) { if (value instanceof List<?> list) return list.stream().map(this::string).toList(); return List.of(); }
    private List<Map<String, Object>> mapList(Object value) { if (value instanceof List<?> list) { List<Map<String, Object>> result = new ArrayList<>(); for (Object item : list) if (item instanceof Map<?, ?> map) { Map<String, Object> copy = new LinkedHashMap<>(); map.forEach((key, val) -> copy.put(String.valueOf(key), val)); result.add(copy); } return result; } return new ArrayList<>(); }
    private String string(Object value) { return value == null ? "" : String.valueOf(value); }
    private int intValue(Object value) { try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return 0; } }
    private int intSetting(Map<String, Object> map, String key) { return intValue(map.get(key)); }
    private int score(GameParticipant p) { return p.getScore() == null ? 0 : p.getScore(); }
    private Long longValue(Object value) { try { return value == null ? null : Long.valueOf(String.valueOf(value)); } catch (Exception e) { return null; } }
    private LocalDateTime parseDate(String value) { try { return value == null || value.isBlank() ? null : LocalDateTime.parse(value); } catch (Exception e) { return null; } }

    private String normalizeKana(String input, String script) { StringBuilder out = new StringBuilder(); String allowed = "KATAKANA".equals(script) ? "KATAKANA" : "HIRAGANA"; for (char c : (input == null ? "" : input.trim()).toCharArray()) { if (isKana(c) && ((allowed.equals("HIRAGANA") && c >= '\u3041' && c <= '\u3096') || (allowed.equals("KATAKANA") && c >= '\u30a1' && c <= '\u30fa'))) out.append(c); } return out.toString(); }
    private boolean isKana(char c) { return (c >= '\u3041' && c <= '\u3096') || (c >= '\u30a1' && c <= '\u30fa'); }
    private String toHiragana(String value) { StringBuilder b = new StringBuilder(); for (char c : value.toCharArray()) b.append(c >= '\u30a1' && c <= '\u30fa' ? (char) (c - 0x60) : c); return b.toString(); }
    private String lastKana(String value) { if (value == null || value.isEmpty()) return ""; char c = value.charAt(value.length() - 1); return c == 'ン' ? "ん" : String.valueOf(c); }
    private int moraCount(String value) { int n = 0; for (char c : value.toCharArray()) if ("ゃゅょぁぃぅぇぉっャュョァィゥェォッー".indexOf(c) < 0) n++; return Math.max(1, n); }
}
