package in.gharsetu.storage;

import in.gharsetu.common.ApiException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ImageValidatorTest {
    @Test
    void detectsByMagicBytes() {
        assertThat(ImageValidator.detectExtension(new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0})).isEqualTo("jpg");
        assertThat(ImageValidator.detectExtension("RIFF0000WEBPVP8 ".getBytes())).isEqualTo("webp");
        assertThatThrownBy(() -> ImageValidator.detectExtension("GIF89a".getBytes())).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> ImageValidator.detectExtension(new byte[(int) ImageValidator.MAX_BYTES + 1]))
                .isInstanceOf(ApiException.class);
    }
}
