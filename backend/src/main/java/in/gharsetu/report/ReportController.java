package in.gharsetu.report;

import in.gharsetu.audit.AuditService;
import in.gharsetu.auth.AuthUser;
import in.gharsetu.auth.CurrentUser;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.RateLimiter;
import in.gharsetu.common.RequestUtils;
import in.gharsetu.property.PropertyRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ReportController {
    private final ReportedListingRepository reports;
    private final PropertyRepository properties;
    private final RateLimiter rateLimiter;
    private final AuditService audit;

    public record CreateReport(@NotNull ReportedListing.Reason reason, @Size(max = 1000) String details) {}

    public record ReportReceipt(Long id, String message) {}

    @PostMapping("/properties/{id}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ReportReceipt report(@PathVariable Long id, @Valid @RequestBody CreateReport req, HttpServletRequest http) {
        rateLimiter.check("report", RequestUtils.clientIp(http), 5, Duration.ofHours(1));
        var property = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property"));
        Long reporterId = CurrentUser.optional().map(AuthUser::id).orElse(null);
        ReportedListing r = new ReportedListing();
        r.setProperty(property);
        r.setReporterId(reporterId);
        r.setReason(req.reason());
        r.setDetails(req.details() == null ? null : req.details().trim());
        reports.save(r);
        audit.log(reporterId, "LISTING_REPORTED", "PROPERTY", id, "reason=" + req.reason());
        return new ReportReceipt(r.getId(), "Thank you. Our team will review this listing.");
    }
}
