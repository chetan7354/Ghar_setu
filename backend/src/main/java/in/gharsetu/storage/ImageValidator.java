package in.gharsetu.storage;

import in.gharsetu.common.ApiException;

/** Detects the real image type from magic bytes, so a renamed .exe cannot pass as a .jpg. */
public final class ImageValidator {
    public static final long MAX_BYTES = 8L * 1024 * 1024;

    private ImageValidator() {}

    public static String detectExtension(byte[] d) {
        if (d.length > MAX_BYTES) {
            throw ApiException.badRequest("Image is larger than 8 MB");
        }
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') {
            return "png";
        }
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "webp";
        }
        throw ApiException.badRequest("Only JPEG, PNG or WebP images are allowed");
    }
}
