package in.gharsetu.admin;

import in.gharsetu.audit.AuditLog;
import in.gharsetu.audit.AuditLogRepository;
import in.gharsetu.audit.AuditService;
import in.gharsetu.auth.*;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.PageResponse;
import in.gharsetu.enquiry.EnquiryRepository;
import in.gharsetu.promotion.*;
import in.gharsetu.property.Property;
import in.gharsetu.property.PropertyEnums.ListingStatus;
import in.gharsetu.property.PropertyEnums.ModerationStatus;
import in.gharsetu.property.PropertyRepository;
import in.gharsetu.property.PropertyService;
import in.gharsetu.report.ReportedListing;
import in.gharsetu.report.ReportedListingRepository;
import in.gharsetu.visit.SiteVisitRepository;
import in.gharsetu.visit.SiteVisitRequest;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final PropertyRepository properties;
    private final PropertyService propertyService;
    private final UserRepository users;
    private final UserStatusCache userStatusCache;
    private final EnquiryRepository enquiries;
    private final SiteVisitRepository visits;
    private final ReportedListingRepository reports;
    private final PromotionPackageRepository packages;
    private final ListingPromotionRepository promotions;
    private final AuditLogRepository auditLogs;
    private final AuditService audit;

    public record Stats(long totalUsers, long activeListings, long pendingModeration, long totalEnquiries,
                        long visitsRequested, long visitsCompleted, long openReports,
                        long manualFeaturedPromotions, long paidFeaturedPromotions, String revenueNote) {}

    public record ModerationItem(Long id, String title, String ownerName, String ownerEmail, String locality,
                                 BigDecimal price, String propertyType, Long possibleDuplicateOf,
                                 int imageCount, Instant createdAt) {}

    public record Decision(@Size(max = 500) String note) {}

    public record ReportItem(Long id, Long propertyId, String propertyTitle, ReportedListing.Reason reason,
                             String details, Instant createdAt) {}

    public record ResolveReport(@NotNull ReportedListing.Status outcome, boolean pauseListing) {}

    public record UserItem(Long id, String fullName, String email, String phone, Set<Role> roles,
                           UserStatus status, Instant createdAt) {}

    public record PackageRequest(@NotBlank @Size(max = 40) @Pattern(regexp = "^[A-Z0-9_]+$") String code,
                                 @NotBlank @Size(max = 100) String name,
                                 @Min(1) @Max(365) int durationDays,
                                 @NotNull @DecimalMin("0") BigDecimal price, boolean active) {}

    public record FeatureRequest(@NotNull Long packageId) {}

    public record AuditItem(Long id, Long actorId, String action, String entityType, Long entityId,
                            String details, Instant createdAt) {}

    @Transactional(readOnly = true)
    public Stats stats() {
        return new Stats(users.count(),
                properties.countByStatusAndModerationStatus(ListingStatus.ACTIVE, ModerationStatus.APPROVED),
                properties.countByModerationStatusAndStatusNot(ModerationStatus.PENDING, ListingStatus.DELETED),
                enquiries.count(), visits.count(), visits.countByStatus(SiteVisitRequest.Status.COMPLETED),
                reports.countByStatus(ReportedListing.Status.OPEN),
                promotions.countBySource(ListingPromotion.Source.ADMIN_MANUAL),
                promotions.countBySource(ListingPromotion.Source.PAYMENT),
                "No revenue is recorded yet: payment gateway is not integrated.");
    }

    @Transactional(readOnly = true)
    public PageResponse<ModerationItem> moderationQueue(int page) {
        var result = properties.findByModerationStatusAndStatusNotOrderByCreatedAtAsc(ModerationStatus.PENDING,
                ListingStatus.DELETED, PageRequest.of(Math.max(page, 0), 20));
        return PageResponse.of(result, p -> new ModerationItem(p.getId(), p.getTitle(), p.getOwner().getFullName(),
                p.getOwner().getEmail(), p.getLocality().getName(), p.getPrice(), p.getPropertyType().name(),
                p.getPossibleDuplicateOf(), p.getImages().size(), p.getCreatedAt()));
    }

    @Transactional
    public void approve(AuthUser admin, Long id, Decision d) {
        Property p = load(id);
        p.setModerationStatus(ModerationStatus.APPROVED);
        p.setModerationNote(d == null ? null : d.note());
        if (p.getPublishedAt() == null) {
            p.setPublishedAt(Instant.now());
        }
        audit.log(admin.id(), "LISTING_APPROVED", "PROPERTY", id, d == null ? null : d.note());
    }

    @Transactional
    public void reject(AuthUser admin, Long id, Decision d) {
        if (d == null || d.note() == null || d.note().isBlank()) {
            throw ApiException.badRequest("Please give the owner a reason for rejection");
        }
        Property p = load(id);
        p.setModerationStatus(ModerationStatus.REJECTED);
        p.setModerationNote(d.note().trim());
        audit.log(admin.id(), "LISTING_REJECTED", "PROPERTY", id, d.note());
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportItem> openReports(int page) {
        return PageResponse.of(reports.findByStatusOrderByCreatedAtAsc(ReportedListing.Status.OPEN,
                        PageRequest.of(Math.max(page, 0), 20)),
                r -> new ReportItem(r.getId(), r.getProperty().getId(), r.getProperty().getTitle(), r.getReason(),
                        r.getDetails(), r.getCreatedAt()));
    }

    @Transactional
    public void resolveReport(AuthUser admin, Long id, ResolveReport req) {
        if (req.outcome() == ReportedListing.Status.OPEN) {
            throw ApiException.badRequest("Choose ACTION_TAKEN or DISMISSED");
        }
        ReportedListing r = reports.findById(id).orElseThrow(() -> ApiException.notFound("Report"));
        r.setStatus(req.outcome());
        r.setResolvedBy(admin.id());
        r.setResolvedAt(Instant.now());
        if (req.pauseListing() && r.getProperty().getStatus() == ListingStatus.ACTIVE) {
            r.getProperty().setStatus(ListingStatus.PAUSED);
            r.getProperty().setModerationNote("Paused after a report review");
        }
        audit.log(admin.id(), "REPORT_RESOLVED", "REPORT", id,
                "outcome=" + req.outcome() + ", paused=" + req.pauseListing());
    }

    @Transactional(readOnly = true)
    public PageResponse<UserItem> users(String q, int page) {
        String query = q == null || q.isBlank() ? null : q.trim();
        return PageResponse.of(users.search(query, PageRequest.of(Math.max(page, 0), 20)),
                u -> new UserItem(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getRoles(),
                        u.getStatus(), u.getCreatedAt()));
    }

    @Transactional
    public void setUserStatus(AuthUser admin, Long id, UserStatus status) {
        if (admin.id().equals(id)) {
            throw ApiException.badRequest("You cannot change your own account status");
        }
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        u.setStatus(status);
        userStatusCache.evict(id);
        audit.log(admin.id(), "USER_" + status.name(), "USER", id, null);
    }

    @Transactional(readOnly = true)
    public java.util.List<PromotionController.PackageView> allPackages() {
        return packages.findAllByOrderByDurationDaysAsc().stream().map(PromotionController.PackageView::of).toList();
    }

    @Transactional
    public PromotionController.PackageView savePackage(AuthUser admin, Long id, PackageRequest req) {
        PromotionPackage p = id == null ? new PromotionPackage()
                : packages.findById(id).orElseThrow(() -> ApiException.notFound("Package"));
        p.setCode(req.code());
        p.setName(req.name().trim());
        p.setDurationDays(req.durationDays());
        p.setPrice(req.price());
        p.setActive(req.active());
        packages.save(p);
        audit.log(admin.id(), id == null ? "PACKAGE_CREATED" : "PACKAGE_UPDATED", "PROMOTION_PACKAGE", p.getId(),
                req.code() + " price=" + req.price());
        return PromotionController.PackageView.of(p);
    }

    /** Phase 1: admin features a listing manually (e.g. after an offline payment). */
    @Transactional
    public Instant feature(AuthUser admin, Long propertyId, FeatureRequest req) {
        Property p = load(propertyId);
        if (!p.isPubliclyVisible()) {
            throw ApiException.badRequest("Only active, approved listings can be featured");
        }
        PromotionPackage pkg = packages.findById(req.packageId()).filter(PromotionPackage::isActive)
                .orElseThrow(() -> ApiException.badRequest("Unknown or inactive package"));
        Instant now = Instant.now();
        Instant start = p.isFeatured() ? p.getFeaturedUntil() : now;
        Instant end = start.plus(Duration.ofDays(pkg.getDurationDays()));
        ListingPromotion lp = new ListingPromotion();
        lp.setPropertyId(propertyId);
        lp.setPromotionPackage(pkg);
        lp.setStartsAt(start);
        lp.setEndsAt(end);
        lp.setSource(ListingPromotion.Source.ADMIN_MANUAL);
        lp.setCreatedBy(admin.id());
        lp.setCreatedAt(now);
        promotions.save(lp);
        p.setFeaturedUntil(end);
        audit.log(admin.id(), "LISTING_FEATURED", "PROPERTY", propertyId, pkg.getCode() + " until " + end);
        return end;
    }

    @Transactional
    public void markContactVerified(AuthUser admin, Long propertyId, boolean verified) {
        Property p = load(propertyId);
        p.setContactVerified(verified);
        audit.log(admin.id(), verified ? "CONTACT_VERIFIED" : "CONTACT_UNVERIFIED", "PROPERTY", propertyId, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditItem> auditLogs(int page) {
        return PageResponse.of(auditLogs.findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(page, 0), 50)),
                (AuditLog a) -> new AuditItem(a.getId(), a.getActorId(), a.getAction(), a.getEntityType(),
                        a.getEntityId(), a.getDetails(), a.getCreatedAt()));
    }

    private Property load(Long id) {
        return properties.findById(id).filter(p -> p.getStatus() != ListingStatus.DELETED)
                .orElseThrow(() -> ApiException.notFound("Property"));
    }
}
