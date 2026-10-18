package in.gharsetu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String brandName,
        Jwt jwt,
        Cors cors,
        Storage storage,
        BootstrapAdmin bootstrapAdmin) {

    public record Jwt(String secret, long expiryMinutes) {}

    public record Cors(List<String> allowedOrigins) {}

    public record Storage(String provider, String localDir, String publicBaseUrl) {}

    public record BootstrapAdmin(String email, String password, String phone) {}
}
