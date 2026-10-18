package in.gharsetu.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Business error that maps directly to an HTTP status with a safe, user-facing message. */
@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public static ApiException notFound(String what) {
        return new ApiException(HttpStatus.NOT_FOUND, what + " not found");
    }

    public static ApiException forbidden() {
        return new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to perform this action");
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }
}
