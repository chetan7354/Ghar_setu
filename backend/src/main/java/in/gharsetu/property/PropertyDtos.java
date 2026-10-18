package in.gharsetu.property;

import in.gharsetu.property.PropertyEnums.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class PropertyDtos {
    private PropertyDtos() {}

    public record PropertyRequest(
            @NotBlank @Size(min = 10, max = 150) String title,
            @NotNull PropertyType propertyType,
            @NotNull @DecimalMin(value = "10000", message = "must be at least 10,000")
            @DecimalMax(value = "10000000000", message = "looks too high") BigDecimal price,
            boolean priceNegotiable,
            @DecimalMin(value = "50") @DecimalMax(value = "10000000") BigDecimal builtUpArea,
            @DecimalMin(value = "1") @DecimalMax(value = "100000000") BigDecimal plotArea,
            @NotNull AreaUnit areaUnit,
            @Min(0) @Max(20) Integer bedrooms,
            @Min(0) @Max(20) Integer bathrooms,
            Furnishing furnishing,
            @Min(0) @Max(100) Integer propertyAgeYears,
            @NotNull Possession possession,
            @NotBlank @Size(min = 30, max = 5000) String description,
            @NotBlank @Size(max = 255) String addressLine,
            @NotNull Long localityId,
            @NotBlank @Pattern(regexp = "^[1-9]\\d{5}$", message = "must be a 6-digit PIN code") String pinCode,
            @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
            @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
            @NotNull ContactPreference contactPreference,
            boolean showPhone,
            @Size(max = 30) Set<String> amenityCodes) {}

    public record ImageView(Long id, String url, int sortOrder) {}

    public record LocalityRef(Long id, String name, String slug) {}

    public record TrustView(boolean contactVerified, boolean ownershipDocumentsReviewed, boolean directOwner) {}

    public record PropertyCard(Long id, String title, PropertyType propertyType, Category category,
                               BigDecimal price, boolean priceNegotiable, BigDecimal builtUpArea,
                               BigDecimal plotArea, AreaUnit areaUnit, Integer bedrooms, Integer bathrooms,
                               Furnishing furnishing, Possession possession, LocalityRef locality, String city,
                               String coverImageUrl, boolean featured, TrustView trust, Instant publishedAt) {}

    public record PropertyDetail(Long id, String title, PropertyType propertyType, Category category,
                                 ListingType listingType, BigDecimal price, boolean priceNegotiable,
                                 BigDecimal builtUpArea, BigDecimal plotArea, AreaUnit areaUnit,
                                 Integer bedrooms, Integer bathrooms, Furnishing furnishing,
                                 Integer propertyAgeYears, Possession possession, String description,
                                 String addressLine, LocalityRef locality, String city, String pinCode,
                                 BigDecimal latitude, BigDecimal longitude, List<ImageView> images,
                                 List<String> amenities, List<String> amenityCodes, OwnerView owner,
                                 boolean featured, Instant featuredUntil, TrustView trust,
                                 ListingStatus status, ModerationStatus moderationStatus,
                                 String moderationNote, boolean isOwner, boolean favourited, int viewCount,
                                 Instant publishedAt, Instant createdAt, Instant updatedAt) {}

    /** Phone is only filled in once the viewer has enquired (or is the owner / admin). */
    public record OwnerView(Long id, String name, ContactPreference contactPreference, String phone,
                            boolean phoneHidden) {}

    public record MyListing(PropertyCard card, ListingStatus status, ModerationStatus moderationStatus,
                            String moderationNote, int viewCount, long enquiryCount, long visitRequestCount,
                            Instant featuredUntil) {}

    public enum SortOrder { relevance, newest, price_asc, price_desc }

    public record SearchCriteria(String city, String locality, Category category, PropertyType type,
                                 BigDecimal minPrice, BigDecimal maxPrice, Integer minBedrooms,
                                 BigDecimal minArea, BigDecimal maxArea, Furnishing furnishing,
                                 Possession possession, Boolean featured, Boolean verified,
                                 String q, SortOrder sort) {}
}
