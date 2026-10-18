package in.gharsetu.auth;

import in.gharsetu.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class JwtService {
    private final SecretKey key;
    private final Duration expiry;

    public JwtService(AppProperties props) {
        String secret = props.jwt().secret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be set and at least 32 bytes long");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiry = Duration.ofMinutes(props.jwt().expiryMinutes());
    }

    public String issue(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("roles", user.getRoles().stream().map(Enum::name).toList())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiry)))
                .signWith(key)
                .compact();
    }

    public Optional<AuthUser> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            Set<Role> roles = EnumSet.noneOf(Role.class);
            Object raw = c.get("roles");
            if (raw instanceof List<?> list) {
                list.forEach(r -> roles.add(Role.valueOf(r.toString())));
            }
            return Optional.of(new AuthUser(Long.valueOf(c.getSubject()), c.get("email", String.class), roles));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
