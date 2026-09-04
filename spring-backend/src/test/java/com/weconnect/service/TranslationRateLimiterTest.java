package com.weconnect.service;

import com.weconnect.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TranslationRateLimiterTest {
    @Test
    void limitsEachUserWithinTheWindowAndAllowsRequestsAfterReset() {
        AtomicLong now = new AtomicLong(1_000);
        TranslationRateLimiter limiter = new TranslationRateLimiter(2, 60, now::get);

        limiter.acquire(10L);
        limiter.acquire(10L);
        limiter.acquire(20L);

        assertThatThrownBy(() -> limiter.acquire(10L))
                .isInstanceOfSatisfying(BusinessException.class, exception ->
                        assertThat(exception.getHttpStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS)
                );

        now.addAndGet(60_000);
        limiter.acquire(10L);
    }
}
