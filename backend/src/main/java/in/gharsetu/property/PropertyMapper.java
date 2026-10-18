package in.gharsetu.property;

import in.gharsetu.property.PropertyDtos.*;

import java.util.Comparator;

final class PropertyMapper {
    private PropertyMapper() {}

    static TrustView trust(Property p) {
        return new TrustView(p.isContactVerified(), p.getOwnershipReviewedAt() != null, true);
    }

    static LocalityRef locality(Property p) {
        return new LocalityRef(p.getLocality().getId(), p.getLocality().getName(), p.getLocality().getSlug());
    }

    static PropertyCard card(Property p, String coverUrl) {
        return new PropertyCard(p.getId(), p.getTitle(), p.getPropertyType(), p.getCategory(), p.getPrice(),
                p.isPriceNegotiable(), p.getBuiltUpArea(), p.getPlotArea(), p.getAreaUnit(), p.getBedrooms(),
                p.getBathrooms(), p.getFurnishing(), p.getPossession(), locality(p), p.getCity().getName(),
                coverUrl, p.isFeatured(), trust(p), p.getPublishedAt());
    }

    static PropertyDetail detail(Property p, OwnerView owner, boolean isOwner, boolean favourited) {
        var amenities = p.getAmenities().stream().sorted(Comparator.comparing(Amenity::getLabel)).toList();
        return new PropertyDetail(p.getId(), p.getTitle(), p.getPropertyType(), p.getCategory(), p.getListingType(),
                p.getPrice(), p.isPriceNegotiable(), p.getBuiltUpArea(), p.getPlotArea(), p.getAreaUnit(),
                p.getBedrooms(), p.getBathrooms(), p.getFurnishing(), p.getPropertyAgeYears(), p.getPossession(),
                p.getDescription(), p.getAddressLine(), locality(p), p.getCity().getName(), p.getPinCode(),
                p.getLatitude(), p.getLongitude(),
                p.getImages().stream().map(i -> new ImageView(i.getId(), i.getUrl(), i.getSortOrder())).toList(),
                amenities.stream().map(Amenity::getLabel).toList(),
                amenities.stream().map(Amenity::getCode).toList(),
                owner, p.isFeatured(), p.getFeaturedUntil(), trust(p), p.getStatus(), p.getModerationStatus(),
                isOwner ? p.getModerationNote() : null, isOwner, favourited, p.getViewCount(),
                p.getPublishedAt(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
