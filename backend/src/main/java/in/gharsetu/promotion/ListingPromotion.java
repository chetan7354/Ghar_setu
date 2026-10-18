package in.gharsetu.promotion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "listing_promotions")
@Getter
@Setter
public class ListingPromotion {
    public enum Source { ADMIN_MANUAL, PAYMENT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long propertyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "package_id")
    private PromotionPackage promotionPackage;

    private Instant startsAt;
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    private Source source = Source.ADMIN_MANUAL;

    private Long createdBy;
    private Instant createdAt;
}
