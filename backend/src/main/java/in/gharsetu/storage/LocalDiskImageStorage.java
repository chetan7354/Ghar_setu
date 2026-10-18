package in.gharsetu.storage;

import in.gharsetu.config.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalDiskImageStorage implements ImageStorage {
    private final Path root;
    private final String baseUrl;

    public LocalDiskImageStorage(AppProperties props) {
        this.root = Path.of(props.storage().localDir()).toAbsolutePath().normalize();
        this.baseUrl = props.storage().publicBaseUrl();
        try {
            Files.createDirectories(root.resolve("properties"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    public Path root() {
        return root;
    }

    @Override
    public StoredImage store(byte[] data, String extension) {
        String key = "properties/" + UUID.randomUUID() + "." + extension;
        try {
            Files.write(root.resolve(key), data);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return new StoredImage(key, baseUrl + "/uploads/" + key);
    }

    @Override
    public void delete(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(p);
        } catch (IOException e) {
            log.warn("Could not delete image {}", key, e);
        }
    }
}
