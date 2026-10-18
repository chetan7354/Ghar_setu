package in.gharsetu.storage;

/** Where property photos live. Local disk for development; Cloudinary is pending credentials. */
public interface ImageStorage {
    record StoredImage(String key, String url) {}

    StoredImage store(byte[] data, String extension);

    void delete(String key);
}
