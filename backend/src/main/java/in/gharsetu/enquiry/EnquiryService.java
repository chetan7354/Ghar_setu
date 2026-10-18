package in.gharsetu.enquiry;

import in.gharsetu.audit.AuditService;
import in.gharsetu.auth.AuthUser;
import in.gharsetu.auth.UserRepository;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.PageResponse;
import in.gharsetu.common.RateLimiter;
import in.gharsetu.property.Property;
import in.gharsetu.property.PropertyRepository;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class EnquiryService {
    private final EnquiryRepository enquiries;
    private final PropertyRepository properties;
    private final UserRepository users;
    private final RateLimiter rateLimiter;
    private final AuditService audit;

    public record CreateEnquiry(@NotBlank @Size(min = 10, max = 1000) String message, boolean sharePhone) {}

    public record Reply(@NotBlank @Size(min = 2, max = 1000) String reply) {}

    public record EnquiryView(Long id, Long propertyId, String propertyTitle, String counterpartName,
                              String counterpartPhone, String message, String ownerReply, Enquiry.Status status,
                              Instant createdAt, Instant updatedAt) {}

    @Transactional
    public EnquiryView create(AuthUser buyer, Long propertyId, CreateEnquiry req) {
        rateLimiter.check("enquiry", String.valueOf(buyer.id()), 20, Duration.ofHours(1));
        Property p = properties.findById(propertyId).filter(Property::isPubliclyVisible)
                .orElseThrow(() -> ApiException.notFound("Property"));
        if (p.getOwner().getId().equals(buyer.id())) {
            throw ApiException.badRequest("You cannot enquire about your own listing");
        }
        if (enquiries.countByBuyerIdAndPropertyIdAndCreatedAtAfter(buyer.id(), propertyId,
                Instant.now().minus(Duration.ofHours(24))) >= 3) {
            throw ApiException.badRequest("You have already sent several enquiries for this property today");
        }
        Enquiry e = new Enquiry();
        e.setProperty(p);
        e.setBuyer(users.getReferenceById(buyer.id()));
        e.setOwner(p.getOwner());
        e.setMessage(req.message().trim());
        e.setBuyerPhoneShared(req.sharePhone());
        enquiries.save(e);
        audit.log(buyer.id(), "ENQUIRY_CREATED", "ENQUIRY", e.getId(), "property=" + propertyId);
        return viewForBuyer(e);
    }

    @Transactional
    public EnquiryView reply(AuthUser owner, Long enquiryId, Reply req) {
        Enquiry e = enquiries.findById(enquiryId).orElseThrow(() -> ApiException.notFound("Enquiry"));
        if (!e.getOwner().getId().equals(owner.id())) {
            throw ApiException.forbidden();
        }
        e.setOwnerReply(req.reply().trim());
        e.setStatus(Enquiry.Status.REPLIED);
        audit.log(owner.id(), "ENQUIRY_REPLIED", "ENQUIRY", e.getId(), null);
        return viewForOwner(e);
    }

    @Transactional
    public PageResponse<EnquiryView> received(AuthUser owner, int page) {
        var result = enquiries.findByOwnerIdOrderByCreatedAtDesc(owner.id(), PageRequest.of(Math.max(page, 0), 20));
        // Opening the inbox marks new enquiries as read.
        result.getContent().stream().filter(e -> e.getStatus() == Enquiry.Status.NEW)
                .forEach(e -> e.setStatus(Enquiry.Status.READ));
        return PageResponse.of(result, this::viewForOwner);
    }

    @Transactional(readOnly = true)
    public PageResponse<EnquiryView> sent(AuthUser buyer, int page) {
        var result = enquiries.findByBuyerIdOrderByCreatedAtDesc(buyer.id(), PageRequest.of(Math.max(page, 0), 20));
        return PageResponse.of(result, this::viewForBuyer);
    }

    private EnquiryView viewForOwner(Enquiry e) {
        return new EnquiryView(e.getId(), e.getProperty().getId(), e.getProperty().getTitle(),
                e.getBuyer().getFullName(), e.isBuyerPhoneShared() ? e.getBuyer().getPhone() : null,
                e.getMessage(), e.getOwnerReply(), e.getStatus(), e.getCreatedAt(), e.getUpdatedAt());
    }

    private EnquiryView viewForBuyer(Enquiry e) {
        Property p = e.getProperty();
        boolean phoneOk = p.isShowPhone() && p.getContactPreference() != in.gharsetu.property.PropertyEnums.ContactPreference.CHAT;
        return new EnquiryView(e.getId(), p.getId(), p.getTitle(), e.getOwner().getFullName(),
                phoneOk ? e.getOwner().getPhone() : null, e.getMessage(), e.getOwnerReply(), e.getStatus(),
                e.getCreatedAt(), e.getUpdatedAt());
    }
}
