package in.gharsetu.auth;

import in.gharsetu.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class CurrentUser {
    private CurrentUser() {}

    public static Optional<AuthUser> optional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public static AuthUser require() {
        return optional().orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Please log in"));
    }
}
