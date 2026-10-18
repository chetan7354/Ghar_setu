package in.gharsetu.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Short-lived cache of whether a user is still active, so a suspended user's
 * existing tokens stop working within a minute without a DB hit per request.
 */
@Component
@RequiredArgsConstructor
public class UserStatusCache {
    private static final Duration TTL = Duration.ofSeconds(60);
    private final UserRepository users;
    private final Map<Long, Entry> cache = new ConcurrentHashMap<>();

    private record Entry(boolean active, Instant at) {}

    public boolean isActive(Long userId) {
        Entry e = cache.get(userId);
        if (e == null || e.at.plus(TTL).isBefore(Instant.now())) {
            boolean active = users.findById(userId).map(u -> u.getStatus() == UserStatus.ACTIVE).orElse(false);
            e = new Entry(active, Instant.now());
            cache.put(userId, e);
        }
        return e.active;
    }

    public void evict(Long userId) {
        cache.remove(userId);
    }
}
