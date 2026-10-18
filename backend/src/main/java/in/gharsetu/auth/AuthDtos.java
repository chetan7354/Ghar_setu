package in.gharsetu.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

public final class AuthDtos {
    private AuthDtos() {}

    public enum AccountType { BUYER, SELLER }

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 120) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "must be a 10-digit Indian mobile number") String phone,
            @NotBlank @Size(min = 8, max = 72, message = "must be 8 to 72 characters") String password,
            @NotNull AccountType accountType) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UpdateProfileRequest(@NotBlank @Size(min = 2, max = 120) String fullName) {}

    public record UserView(Long id, String fullName, String email, String phone, Set<Role> roles,
                           boolean emailVerified, boolean phoneVerified) {
        public static UserView of(User u) {
            return new UserView(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRoles(),
                    u.getEmailVerifiedAt() != null, u.getPhoneVerifiedAt() != null);
        }
    }

    public record AuthResponse(String token, UserView user) {}
}
