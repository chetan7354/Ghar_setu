package in.gharsetu.property;

import in.gharsetu.audit.AuditService;
import in.gharsetu.auth.AuthUser;
import in.gharsetu.auth.Role;
import in.gharsetu.auth.User;
import in.gharsetu.auth.UserRepository;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.PageResponse;
import in.gharsetu.enquiry.EnquiryRepository;
import in.gharsetu.favourite.FavouriteRepository;
import in.gharsetu.location.Locality;
import in.gharsetu.location.LocalityRepository;
import in.gharsetu.property.PropertyDtos.*;
import in.gharsetu.property.PropertyEnums.*;
import in.gharsetu.storage.ImageStorage;
import in.gharsetu.storage.ImageValidator;
import in.gharsetu.visit.SiteVisitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {
    public static final int MAX_IMAGES = 20;
    private static final int MAX_PAGE_SIZE = 50;

    private final PropertyRepository properties;
    private final PropertyImageRepository images;
    private final AmenityRepository amenities;
    private final LocalityRepository localities;
    private final UserRepository users;
    private final EnquiryRepository enquiries;
    private final SiteVisitRepository visits;
    private final FavouriteRepository favourites;
    private final ImageStorage storage;
    private final AuditService audit;

    // ---------- public search ----------

    @Transactional(readOnly = true)
    public PageResponse<PropertyCard> search(SearchCriteria c, int page, int size) {
        if (c.minPrice() != null && c.maxPrice() != null && c.minPrice().compareTo(c.maxPrice()) > 0) {
            throw ApiException.badRequest("Minimum price cannot be more than maximum price");
        }
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        Page<Property> result = properties.findAll(PropertySpecifications.publicSearch(c, Instant.now()), pageable);
        return toCards(result);
    }

    PageResponse<PropertyCard> toCards(Page<Property> result) {
        Map<Long, String> covers = coverUrls(result.getContent().stream().map(Property::getId).toList());
        return PageResponse.of(result, p -> PropertyMapper.card(p, covers.get(p.getId())));
    }

    public Map<Long, String> coverUrls(Collection<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, String> m = new HashMap<>();
        images.findCoverImages(ids).forEach(i -> m.putIfAbsent(i.getProperty().getId(), i.getUrl()));
        return m;
    }

    @Transactional
    public PropertyDetail get(Long id, Optional<AuthUser> viewer) {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property"));
        boolean isOwner = viewer.map(v -> v.id().equals(p.getOwner().getId())).orElse(false);
        boolean isAdmin = viewer.map(AuthUser::isAdmin).orElse(false);
        if (p.getStatus() == ListingStatus.DELETED && !isAdmin) {
            throw ApiException.notFound("Property");
        }
        if (!p.isPubliclyVisible() && p.getStatus() != ListingStatus.SOLD && !isOwner && !isAdmin) {
            throw ApiException.notFound("Property");
        }
        if (!isOwner && p.isPubliclyVisible()) {
            properties.incrementViews(id);
        }
        boolean enquired = viewer.map(v -> enquiries.existsByBuyerIdAndPropertyId(v.id(), id)).orElse(false);
        boolean revealPhone = p.isShowPhone() && p.getContactPreference() != ContactPreference.CHAT
                && (isOwner || isAdmin || enquired);
        User owner = p.getOwner();
        OwnerView ownerView = new OwnerView(owner.getId(), firstName(owner.getFullName()), p.getContactPreference(),
                revealPhone ? owner.getPhone() : null, !revealPhone);
        boolean fav = viewer.map(v -> favourites.existsByUserIdAndPropertyId(v.id(), id)).orElse(false);
        return PropertyMapper.detail(p, ownerView, isOwner, fav);
    }

    private static String firstName(String full) {
        String[] parts = full.trim().split("\\s+");
        return parts.length > 1 ? parts[0] + " " + parts[parts.length - 1].charAt(0) + "." : parts[0];
    }

    // ---------- owner actions ----------

    @Transactional
    public PropertyDetail create(AuthUser actor, PropertyRequest req) {
        requireSeller(actor);
        User owner = users.getReferenceById(actor.id());
        Property p = new Property();
        p.setOwner(owner);
        apply(p, req);
        p.setStatus(ListingStatus.ACTIVE);
        p.setModerationStatus(ModerationStatus.PENDING);
        properties.save(p);
        flagDuplicate(p, users.findById(actor.id()).map(User::getPhone).orElse(""));
        audit.log(actor.id(), "PROPERTY_CREATED", "PROPERTY", p.getId(), p.getTitle());
        return PropertyMapper.detail(p, null, true, false);
    }

    @Transactional
    public PropertyDetail update(AuthUser actor, Long id, PropertyRequest req) {
        Property p = loadOwned(actor, id);
        if (p.getStatus() == ListingStatus.SOLD) {
            throw ApiException.badRequest("A sold listing cannot be edited");
        }
        apply(p, req);
        // Edited listings go back through moderation so approved content cannot be swapped silently.
        p.setModerationStatus(ModerationStatus.PENDING);
        p.setModerationNote(null);
        flagDuplicate(p, p.getOwner().getPhone());
        audit.log(actor.id(), "PROPERTY_UPDATED", "PROPERTY", id, null);
        return PropertyMapper.detail(p, null, true, false);
    }

    @Transactional
    public void changeStatus(AuthUser actor, Long id, ListingStatus target) {
        Property p = loadOwned(actor, id);
        ListingStatus from = p.getStatus();
        boolean allowed = switch (target) {
            case PAUSED -> from == ListingStatus.ACTIVE;
            case ACTIVE -> from == ListingStatus.PAUSED;
            case SOLD -> from == ListingStatus.ACTIVE || from == ListingStatus.PAUSED;
            case DELETED -> true;
        };
        if (!allowed) {
            throw ApiException.badRequest("Cannot change a " + from.name().toLowerCase() + " listing to "
                    + target.name().toLowerCase());
        }
        p.setStatus(target);
        audit.log(actor.id(), "PROPERTY_STATUS_" + target.name(), "PROPERTY", id, "from=" + from);
    }

    @Transactional
    public ImageView addImage(AuthUser actor, Long id, byte[] data) {
        Property p = loadOwned(actor, id);
        long count = images.countByPropertyId(id);
        if (count >= MAX_IMAGES) {
            throw ApiException.badRequest("A listing can have at most " + MAX_IMAGES + " photos");
        }
        String ext = ImageValidator.detectExtension(data);
        ImageStorage.StoredImage stored = storage.store(data, ext);
        PropertyImage img = new PropertyImage();
        img.setProperty(p);
        img.setStorageKey(stored.key());
        img.setUrl(stored.url());
        img.setSortOrder((int) count);
        images.save(img);
        p.getImages().add(img);
        return new ImageView(img.getId(), img.getUrl(), img.getSortOrder());
    }

    @Transactional
    public void deleteImage(AuthUser actor, Long id, Long imageId) {
        Property p = loadOwned(actor, id);
        PropertyImage img = p.getImages().stream().filter(i -> i.getId().equals(imageId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Image"));
        p.getImages().remove(img);
        storage.delete(img.getStorageKey());
    }

    @Transactional(readOnly = true)
    public PageResponse<MyListing> myListings(AuthUser actor, int page, int size) {
        Page<Property> result = properties.findByOwnerIdAndStatusNotOrderByCreatedAtDesc(actor.id(),
                ListingStatus.DELETED, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE)));
        List<Long> ids = result.getContent().stream().map(Property::getId).toList();
        Map<Long, String> covers = coverUrls(ids);
        Map<Long, Long> enq = ids.isEmpty() ? Map.of() : toMap(enquiries.countByPropertyIds(ids));
        Map<Long, Long> vis = ids.isEmpty() ? Map.of() : toMap(visits.countByPropertyIds(ids));
        return PageResponse.of(result, p -> new MyListing(PropertyMapper.card(p, covers.get(p.getId())),
                p.getStatus(), p.getModerationStatus(), p.getModerationNote(), p.getViewCount(),
                enq.getOrDefault(p.getId(), 0L), vis.getOrDefault(p.getId(), 0L), p.getFeaturedUntil()));
    }

    private static Map<Long, Long> toMap(List<Object[]> rows) {
        return rows.stream().collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }

    // ---------- helpers ----------

    Property loadOwned(AuthUser actor, Long id) {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property"));
        if (p.getStatus() == ListingStatus.DELETED) {
            throw ApiException.notFound("Property");
        }
        if (!p.getOwner().getId().equals(actor.id())) {
            throw ApiException.forbidden();
        }
        return p;
    }

    private static void requireSeller(AuthUser actor) {
        if (!actor.roles().contains(Role.SELLER) && !actor.roles().contains(Role.BUILDER)) {
            throw ApiException.forbidden();
        }
    }

    private void apply(Property p, PropertyRequest r) {
        PropertyType type = r.propertyType();
        if (type.isLand()) {
            if (r.plotArea() == null) {
                throw ApiException.badRequest("Plot area is required for land");
            }
        } else if (r.builtUpArea() == null) {
            throw ApiException.badRequest("Built-up area is required");
        }
        if (type.hasRooms() && (r.bedrooms() == null || r.bathrooms() == null)) {
            throw ApiException.badRequest("Bedrooms and bathrooms are required for homes");
        }
        Locality loc = localities.findById(r.localityId())
                .orElseThrow(() -> ApiException.badRequest("Unknown locality"));

        p.setTitle(r.title().trim());
        p.setPropertyType(type);
        p.setCategory(type.category());
        p.setListingType(ListingType.SALE);
        p.setPrice(r.price());
        p.setPriceNegotiable(r.priceNegotiable());
        p.setAreaUnit(r.areaUnit());
        p.setBuiltUpArea(type.isLand() ? null : r.builtUpArea());
        p.setPlotArea(r.plotArea());
        BigDecimal main = type.isLand() ? r.plotArea() : r.builtUpArea();
        p.setAreaSqft(r.areaUnit().toSqft(main));
        p.setBedrooms(type.hasRooms() ? r.bedrooms() : null);
        p.setBathrooms(type.isLand() ? null : r.bathrooms());
        p.setFurnishing(type.hasRooms() ? r.furnishing() : null);
        p.setPropertyAgeYears(type.isLand() ? null : r.propertyAgeYears());
        p.setPossession(r.possession());
        p.setDescription(r.description().trim());
        p.setAddressLine(r.addressLine().trim());
        p.setLocality(loc);
        p.setCity(loc.getCity());
        p.setPinCode(r.pinCode());
        p.setLatitude(r.latitude());
        p.setLongitude(r.longitude());
        p.setContactPreference(r.contactPreference());
        p.setShowPhone(r.showPhone());
        Set<String> codes = r.amenityCodes() == null ? Set.of() : r.amenityCodes();
        List<Amenity> found = codes.isEmpty() ? List.of() : amenities.findByCodeIn(codes);
        if (found.size() != codes.size()) {
            throw ApiException.badRequest("Unknown amenity");
        }
        p.getAmenities().clear();
        p.getAmenities().addAll(found);
    }

    /** Practical duplicate check: same owner or phone, same locality and type, price within 2% and area within 5%. */
    private void flagDuplicate(Property p, String ownerPhone) {
        BigDecimal price = p.getPrice();
        BigDecimal area = p.getAreaSqft();
        List<Long> dups = properties.findPossibleDuplicates(p.getLocality().getId(), p.getPropertyType(),
                price.multiply(new BigDecimal("0.98")), price.multiply(new BigDecimal("1.02")),
                area == null ? null : area.multiply(new BigDecimal("0.95")),
                area == null ? null : area.multiply(new BigDecimal("1.05")),
                p.getOwner().getId(), ownerPhone, p.getId(), PageRequest.of(0, 1));
        p.setPossibleDuplicateOf(dups.isEmpty() ? null : dups.get(0));
    }

    public PropertyCard card(Property p, String coverUrl) {
        return PropertyMapper.card(p, coverUrl);
    }

    @Transactional(readOnly = true)
    public List<AmenityView> amenities() {
        return amenities.findAllByOrderByLabelAsc().stream().map(a -> new AmenityView(a.getCode(), a.getLabel())).toList();
    }

    public record AmenityView(String code, String label) {}
}
