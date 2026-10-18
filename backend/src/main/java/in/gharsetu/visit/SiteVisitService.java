package in.gharsetu.visit;

import in.gharsetu.audit.AuditService;
import in.gharsetu.auth.AuthUser;
import in.gharsetu.auth.UserRepository;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.PageResponse;
import in.gharsetu.common.RateLimiter;
import in.gharsetu.property.Property;
import in.gharsetu.property.PropertyRepository;
import in.gharsetu.visit.SiteVisitRequest.Status;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

/**
 * Site-visit workflow. Every transition checks who is acting and what state the request is in,
 * and is written to the audit log.
 */
@Service
@RequiredArgsConstructor
public class SiteVisitService {
    private final SiteVisitRepository visits;
    private final PropertyRepository properties;
    private final UserRepository users;
    private final RateLimiter rateLimiter;
    private final AuditService audit;
    private final Clock clock;

    public record CreateVisit(@NotNull @Future Instant preferredAt, @Size(max = 500) String note) {}

    public record OwnerDecision(@Size(max = 500) String note) {}

    public record Proposal(@NotNull @Future Instant proposedAt, @Size(max = 500) String note) {}

    public record VisitView(Long id, Long propertyId, String propertyTitle, String locality,
                            String counterpartName, String counterpartPhone, Instant preferredAt,
                            Instant proposedAt, Instant scheduledAt, Status status, String buyerNote,
                            String ownerNote, Instant createdAt, Instant updatedAt) {}

    @Transactional
    public VisitView request(AuthUser buyer, Long propertyId, CreateVisit req) {
        rateLimiter.check("visit", String.valueOf(buyer.id()), 10, Duration.ofHours(1));
        Property p = properties.findById(propertyId).filter(Property::isPubliclyVisible)
                .orElseThrow(() -> ApiException.notFound("Property"));
        if (p.getOwner().getId().equals(buyer.id())) {
            throw ApiException.badRequest("You cannot book a visit to your own listing");
        }
        requireReasonableTime(req.preferredAt());
        if (visits.existsByBuyerIdAndPropertyIdAndStatusIn(buyer.id(), propertyId, Status.OPEN)) {
            throw ApiException.conflict("You already have an open visit request for this property");
        }
        SiteVisitRequest v = new SiteVisitRequest();
        v.setProperty(p);
        v.setBuyer(users.getReferenceById(buyer.id()));
        v.setOwner(p.getOwner());
        v.setPreferredAt(req.preferredAt());
        v.setBuyerNote(trim(req.note()));
        visits.save(v);
        audit.log(buyer.id(), "VISIT_REQUESTED", "SITE_VISIT", v.getId(), "property=" + propertyId);
        return view(v, false);
    }

    @Transactional
    public VisitView accept(AuthUser owner, Long id, OwnerDecision d) {
        SiteVisitRequest v = loadAsOwner(owner, id);
        requireStatus(v, Status.REQUESTED);
        v.setStatus(Status.ACCEPTED);
        v.setOwnerNote(trim(d == null ? null : d.note()));
        return transitioned(owner, v, "VISIT_ACCEPTED", true);
    }

    @Transactional
    public VisitView reject(AuthUser owner, Long id, OwnerDecision d) {
        SiteVisitRequest v = loadAsOwner(owner, id);
        requireStatus(v, Status.REQUESTED, Status.RESCHEDULE_PROPOSED);
        v.setStatus(Status.REJECTED);
        v.setOwnerNote(trim(d == null ? null : d.note()));
        return transitioned(owner, v, "VISIT_REJECTED", true);
    }

    @Transactional
    public VisitView propose(AuthUser owner, Long id, Proposal p) {
        SiteVisitRequest v = loadAsOwner(owner, id);
        requireStatus(v, Status.REQUESTED, Status.RESCHEDULE_PROPOSED, Status.ACCEPTED);
        requireReasonableTime(p.proposedAt());
        v.setProposedAt(p.proposedAt());
        v.setStatus(Status.RESCHEDULE_PROPOSED);
        v.setOwnerNote(trim(p.note()));
        return transitioned(owner, v, "VISIT_RESCHEDULE_PROPOSED", true);
    }

    @Transactional
    public VisitView acceptProposal(AuthUser buyer, Long id) {
        SiteVisitRequest v = loadAsBuyer(buyer, id);
        requireStatus(v, Status.RESCHEDULE_PROPOSED);
        v.setStatus(Status.ACCEPTED);
        return transitioned(buyer, v, "VISIT_PROPOSAL_ACCEPTED", false);
    }

    @Transactional
    public VisitView cancel(AuthUser buyer, Long id) {
        SiteVisitRequest v = loadAsBuyer(buyer, id);
        requireStatus(v, Status.REQUESTED, Status.RESCHEDULE_PROPOSED, Status.ACCEPTED);
        v.setStatus(Status.CANCELLED);
        return transitioned(buyer, v, "VISIT_CANCELLED", false);
    }

    @Transactional
    public VisitView complete(AuthUser owner, Long id) {
        SiteVisitRequest v = loadAsOwner(owner, id);
        requireStatus(v, Status.ACCEPTED);
        if (v.scheduledAt().isAfter(clock.instant())) {
            throw ApiException.badRequest("A visit can only be marked completed after its scheduled time");
        }
        v.setStatus(Status.COMPLETED);
        return transitioned(owner, v, "VISIT_COMPLETED", true);
    }

    @Transactional(readOnly = true)
    public PageResponse<VisitView> received(AuthUser owner, int page) {
        return PageResponse.of(visits.findByOwnerIdOrderByCreatedAtDesc(owner.id(), PageRequest.of(Math.max(page, 0), 20)),
                v -> view(v, true));
    }

    @Transactional(readOnly = true)
    public PageResponse<VisitView> requested(AuthUser buyer, int page) {
        return PageResponse.of(visits.findByBuyerIdOrderByCreatedAtDesc(buyer.id(), PageRequest.of(Math.max(page, 0), 20)),
                v -> view(v, false));
    }

    private VisitView transitioned(AuthUser actor, SiteVisitRequest v, String action, boolean ownerView) {
        audit.log(actor.id(), action, "SITE_VISIT", v.getId(), "status=" + v.getStatus());
        return view(v, ownerView);
    }

    private SiteVisitRequest loadAsOwner(AuthUser owner, Long id) {
        SiteVisitRequest v = visits.findById(id).orElseThrow(() -> ApiException.notFound("Visit request"));
        if (!v.getOwner().getId().equals(owner.id())) {
            throw ApiException.forbidden();
        }
        return v;
    }

    private SiteVisitRequest loadAsBuyer(AuthUser buyer, Long id) {
        SiteVisitRequest v = visits.findById(id).orElseThrow(() -> ApiException.notFound("Visit request"));
        if (!v.getBuyer().getId().equals(buyer.id())) {
            throw ApiException.forbidden();
        }
        return v;
    }

    private static void requireStatus(SiteVisitRequest v, Status... allowed) {
        for (Status s : allowed) {
            if (v.getStatus() == s) {
                return;
            }
        }
        throw ApiException.conflict("This visit request is already " + v.getStatus().name().toLowerCase().replace('_', ' '));
    }

    private void requireReasonableTime(Instant at) {
        Instant now = clock.instant();
        if (at.isBefore(now.plus(Duration.ofHours(1))) || at.isAfter(now.plus(Duration.ofDays(90)))) {
            throw ApiException.badRequest("Choose a time between 1 hour and 90 days from now");
        }
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static VisitView view(SiteVisitRequest v, boolean forOwner) {
        var other = forOwner ? v.getBuyer() : v.getOwner();
        // Phone numbers are shared only once the owner has accepted the visit.
        boolean sharePhone = v.getStatus() == Status.ACCEPTED || v.getStatus() == Status.COMPLETED;
        Property p = v.getProperty();
        return new VisitView(v.getId(), p.getId(), p.getTitle(), p.getLocality().getName(), other.getFullName(),
                sharePhone ? other.getPhone() : null, v.getPreferredAt(), v.getProposedAt(), v.scheduledAt(),
                v.getStatus(), v.getBuyerNote(), v.getOwnerNote(), v.getCreatedAt(), v.getUpdatedAt());
    }
}
