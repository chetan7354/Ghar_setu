package in.gharsetu.auth;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.Set;

/** Authenticated principal placed in the SecurityContext by {@link JwtAuthFilter}. */
public record AuthUser(Long id, String email, Set<Role> roles) {
    public Collection<? extends GrantedAuthority> authorities() {
        return roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r.name())).toList();
    }

    public boolean isAdmin() {
        return roles.contains(Role.ADMIN);
    }
}
