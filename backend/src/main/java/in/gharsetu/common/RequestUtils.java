package in.gharsetu.common;

import jakarta.servlet.http.HttpServletRequest;

public final class RequestUtils {
    private RequestUtils() {}

    /**
     * Client IP. Behind a trusted reverse proxy, enable
     * server.forward-headers-strategy=framework so getRemoteAddr() reflects X-Forwarded-For.
     */
    public static String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
