package in.gharsetu.auth;

import in.gharsetu.audit.AuditService;
import in.gharsetu.auth.AuthDtos.*;
import in.gharsetu.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuditService audit;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        if (users.existsByPhone(req.phone())) {
            throw ApiException.conflict("An account with this phone number already exists");
        }
        User u = new User();
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        u.setPhone(req.phone());
        u.setPasswordHash(encoder.encode(req.password()));
        EnumSet<Role> roles = EnumSet.of(Role.BUYER);
        if (req.accountType() == AccountType.SELLER) {
            roles.add(Role.SELLER);
        }
        u.setRoles(roles);
        users.save(u);
        audit.log(u.getId(), "USER_REGISTERED", "USER", u.getId(), "accountType=" + req.accountType());
        return new AuthResponse(jwt.issue(u), UserView.of(u));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmailIgnoreCase(req.email().trim())
                .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("bad credentials"));
        if (u.getStatus() != UserStatus.ACTIVE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account is suspended. Contact support.");
        }
        return new AuthResponse(jwt.issue(u), UserView.of(u));
    }

    /** Lets an existing buyer start listing properties. */
    @Transactional
    public AuthResponse becomeSeller(Long userId) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        u.getRoles().add(Role.SELLER);
        audit.log(userId, "USER_BECAME_SELLER", "USER", userId, null);
        return new AuthResponse(jwt.issue(u), UserView.of(u));
    }

    @Transactional
    public UserView updateProfile(Long userId, UpdateProfileRequest req) {
        User u = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        u.setFullName(req.fullName().trim());
        return UserView.of(u);
    }

    @Transactional(readOnly = true)
    public UserView me(Long userId) {
        return users.findById(userId).map(UserView::of).orElseThrow(() -> ApiException.notFound("User"));
    }
}
