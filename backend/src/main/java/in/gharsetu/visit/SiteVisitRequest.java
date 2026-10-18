package in.gharsetu.visit;

import in.gharsetu.auth.User;
import in.gharsetu.property.Property;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

@Entity
@Table(name = "site_visit_requests")
@Getter
@Setter
public class SiteVisitRequest {
    public enum Status {
        REQUESTED, ACCEPTED, REJECTED, RESCHEDULE_PROPOSED, CANCELLED, COMPLETED;

        public static final Set<Status> OPEN = EnumSet.of(REQUESTED, ACCEPTED, RESCHEDULE_PROPOSED);
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id")
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id")
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    private Instant preferredAt;
    private Instant proposedAt;

    @Enumerated(EnumType.STRING)
    private Status status = Status.REQUESTED;

    private String buyerNote;
    private String ownerNote;
    private Instant createdAt;
    private Instant updatedAt;

    @Version
    private int version;

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    /** The time both parties should plan for right now. */
    public Instant scheduledAt() {
        return status == Status.RESCHEDULE_PROPOSED || (status == Status.ACCEPTED && proposedAt != null)
                ? proposedAt : preferredAt;
    }
}
