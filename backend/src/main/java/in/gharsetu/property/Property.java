package in.gharsetu.property;

import in.gharsetu.auth.User;
import in.gharsetu.location.City;
import in.gharsetu.location.Locality;
import in.gharsetu.property.PropertyEnums.*;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "properties")
@Getter
@Setter
public class Property {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    private String title;

    @Enumerated(EnumType.STRING)
    private Category category;

    @Enumerated(EnumType.STRING)
    private PropertyType propertyType;

    @Enumerated(EnumType.STRING)
    private ListingType listingType = ListingType.SALE;

    private BigDecimal price;
    private boolean priceNegotiable;
    private BigDecimal builtUpArea;
    private BigDecimal plotArea;

    @Enumerated(EnumType.STRING)
    private AreaUnit areaUnit = AreaUnit.SQFT;

    /** Built-up area (or plot area for land) converted to sq ft, used for area range search. */
    private BigDecimal areaSqft;

    private Integer bedrooms;
    private Integer bathrooms;

    @Enumerated(EnumType.STRING)
    private Furnishing furnishing;

    private Integer propertyAgeYears;

    @Enumerated(EnumType.STRING)
    private Possession possession = Possession.READY;

    private String description;
    private String addressLine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "locality_id")
    private Locality locality;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "city_id")
    private City city;

    private String pinCode;
    private BigDecimal latitude;
    private BigDecimal longitude;

    @Enumerated(EnumType.STRING)
    private ContactPreference contactPreference = ContactPreference.BOTH;

    private boolean showPhone = true;

    @Enumerated(EnumType.STRING)
    private ListingStatus status = ListingStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    private ModerationStatus moderationStatus = ModerationStatus.PENDING;

    private String moderationNote;
    private Long possibleDuplicateOf;

    /** Owner's phone/email was confirmed. Says nothing about legal title. */
    private boolean contactVerified;

    /** Admin reviewed ownership documents. Still not a legal title verification. */
    private Instant ownershipReviewedAt;

    private Instant featuredUntil;
    private int viewCount;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;

    @Version
    private int version;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    private List<PropertyImage> images = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "property_amenities",
            joinColumns = @JoinColumn(name = "property_id"),
            inverseJoinColumns = @JoinColumn(name = "amenity_id"))
    private Set<Amenity> amenities = new HashSet<>();

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean isPubliclyVisible() {
        return status == ListingStatus.ACTIVE && moderationStatus == ModerationStatus.APPROVED;
    }

    public boolean isFeatured() {
        return featuredUntil != null && featuredUntil.isAfter(Instant.now());
    }
}
