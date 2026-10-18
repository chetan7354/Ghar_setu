package in.gharsetu.common;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;

class RateLimiterTest {
    @Test
    void blocksAfterLimitAndRecoversAfterWindow() {
        AtomicLong now = new AtomicLong(1_000_000);
        Clock clock = new Clock() {
            public ZoneOffset getZone() { return ZoneOffset.UTC; }
            public Clock withZone(java.time.ZoneId z) { return this; }
            public Instant instant() { return Instant.ofEpochMilli(now.get()); }
        };
        RateLimiter limiter = new RateLimiter(clock, true);
        for (int i = 0; i < 3; i++) {
            limiter.check("enquiry", "u1", 3, Duration.ofMinutes(1));
        }
        assertThatThrownBy(() -> limiter.check("enquiry", "u1", 3, Duration.ofMinutes(1)))
                .isInstanceOf(ApiException.class).hasMessageContaining("Too many");
        assertThatNoException().isThrownBy(() -> limiter.check("enquiry", "u2", 3, Duration.ofMinutes(1)));
        now.addAndGet(61_000);
        assertThatNoException().isThrownBy(() -> limiter.check("enquiry", "u1", 3, Duration.ofMinutes(1)));
    }
}
