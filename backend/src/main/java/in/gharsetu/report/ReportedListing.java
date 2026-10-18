package in.gharsetu.report;

import in.gharsetu.property.Property;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "reported_listings")
@Getter
@Setter
public class ReportedListing {
    public enum Reason { FAKE, DUPLICATE, WRONG_PRICE, ALREADY_SOLD, BROKER_POSING_AS_OWNER, WRONG_LOCATION, OTHER }

    public enum Status { OPEN, ACTION_TAKEN, DISMISSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id")
    private Property property;

    private Long reporterId;

    @Enumerated(EnumType.STRING)
    private Reason reason;

    private String details;

    @Enumerated(EnumType.STRING)
    private Status status = Status.OPEN;

    private Long resolvedBy;
    private Instant resolvedAt;
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
