package in.gharsetu.common;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window rate limiter kept in memory. Good enough for a single instance;
 * replace with a Redis-backed implementation before running more than one instance.
 */
@Component
public class RateLimiter {
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    private final Clock clock;
    private final boolean enabled;

    @Autowired
    public RateLimiter(@Value("${app.rate-limit.enabled:true}") boolean enabled) {
        this(Clock.systemUTC(), enabled);
    }

    RateLimiter(Clock clock, boolean enabled) {
        this.clock = clock;
        this.enabled = enabled;
    }

    public void check(String bucket, String key, int limit, Duration window) {
        if (!enabled) {
            return;
        }
        long now = clock.millis();
        long cutoff = now - window.toMillis();
        Deque<Long> q = hits.computeIfAbsent(bucket + ":" + key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst() < cutoff) {
                q.pollFirst();
            }
            if (q.size() >= limit) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again later.");
            }
            q.addLast(now);
        }
    }

    @Scheduled(fixedDelay = 600_000)
    void evictIdle() {
        long cutoff = clock.millis() - Duration.ofHours(2).toMillis();
        hits.entrySet().removeIf(e -> {
            synchronized (e.getValue()) {
                return e.getValue().isEmpty() || e.getValue().peekLast() < cutoff;
            }
        });
    }
}
