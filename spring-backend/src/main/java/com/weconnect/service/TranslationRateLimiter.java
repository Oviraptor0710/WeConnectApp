package com.weconnect.service;

import com.weconnect.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

@Component
public class TranslationRateLimiter {
    private static final int CLEANUP_THRESHOLD = 10_000;

    private final int maxRequests;
    private final long windowMillis;
    private final LongSupplier currentTimeMillis;
    private final Map<Long, Window> windows = new ConcurrentHashMap<>();

    @Autowired
    public TranslationRateLimiter(
            @Value("${app.gemini.rate-limit.max-requests:20}") int maxRequests,
            @Value("${app.gemini.rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this(maxRequests, windowSeconds, System::currentTimeMillis);
    }

    TranslationRateLimiter(int maxRequests, long windowSeconds, LongSupplier currentTimeMillis) {
        this.maxRequests = Math.max(1, maxRequests);
        this.windowMillis = Math.max(1, windowSeconds) * 1_000;
        this.currentTimeMillis = currentTimeMillis;
    }

    public void acquire(Long userId) {
        long now = currentTimeMillis.getAsLong();
        boolean[] allowed = {true};
        windows.compute(userId, (ignored, current) -> {
            if (current == null || now - current.startedAtMillis() >= windowMillis) {
                return new Window(now, 1);
            }
            if (current.requestCount() >= maxRequests) {
                allowed[0] = false;
                return current;
            }
            return new Window(current.startedAtMillis(), current.requestCount() + 1);
        });

        if (windows.size() > CLEANUP_THRESHOLD) {
            windows.entrySet().removeIf(entry ->
                    now - entry.getValue().startedAtMillis() >= windowMillis
            );
        }
        if (!allowed[0]) {
            throw BusinessException.tooManyRequests(
                    "Bạn đã yêu cầu dịch quá nhiều lần. Vui lòng thử lại sau."
            );
        }
    }

    private record Window(long startedAtMillis, int requestCount) {
    }
}
