package in.gharsetu.common;

import java.time.Instant;
import java.util.List;

public record ApiError(int status, String error, String message, List<FieldError> fieldErrors,
                       String path, Instant timestamp) {
    public record FieldError(String field, String message) {}
}
