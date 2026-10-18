package in.gharsetu.favourite;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "favourites")
@IdClass(Favourite.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class Favourite {
    @Id
    private Long userId;
    @Id
    private Long propertyId;
    private Instant createdAt;

    public Favourite(Long userId, Long propertyId) {
        this.userId = userId;
        this.propertyId = propertyId;
        this.createdAt = Instant.now();
    }

    public record Key(Long userId, Long propertyId) implements Serializable {
        public Key() {
            this(null, null);
        }
    }
}
