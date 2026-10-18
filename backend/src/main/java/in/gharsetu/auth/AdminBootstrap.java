package in.gharsetu.auth;

import in.gharsetu.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD env vars if no such user exists. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {
    private final AppProperties props;
    private final UserRepository users;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        var cfg = props.bootstrapAdmin();
        if (cfg == null || cfg.email() == null || cfg.email().isBlank()
                || cfg.password() == null || cfg.password().length() < 12) {
            return;
        }
        if (users.existsByEmailIgnoreCase(cfg.email())) {
            return;
        }
        User u = new User();
        u.setFullName("Administrator");
        u.setEmail(cfg.email().toLowerCase());
        u.setPhone(cfg.phone());
        u.setPasswordHash(encoder.encode(cfg.password()));
        u.setRoles(EnumSet.of(Role.ADMIN));
        users.save(u);
        log.info("Bootstrap admin account created for {}", u.getEmail());
    }
}
