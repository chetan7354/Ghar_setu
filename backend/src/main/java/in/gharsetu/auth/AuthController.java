package in.gharsetu.auth;

import in.gharsetu.auth.AuthDtos.*;
import in.gharsetu.common.RateLimiter;
import in.gharsetu.common.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    private final RateLimiter rateLimiter;

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req, HttpServletRequest http) {
        rateLimiter.check("auth", RequestUtils.clientIp(http), 10, Duration.ofMinutes(1));
        return auth.register(req);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest http) {
        rateLimiter.check("auth", RequestUtils.clientIp(http), 10, Duration.ofMinutes(1));
        return auth.login(req);
    }

    @GetMapping("/me")
    public UserView me() {
        return auth.me(CurrentUser.require().id());
    }

    @PatchMapping("/me")
    public UserView updateMe(@Valid @RequestBody UpdateProfileRequest req) {
        return auth.updateProfile(CurrentUser.require().id(), req);
    }

    @PostMapping("/me/become-seller")
    public AuthResponse becomeSeller() {
        return auth.becomeSeller(CurrentUser.require().id());
    }
}
