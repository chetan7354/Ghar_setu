package in.gharsetu.admin;

import in.gharsetu.admin.AdminService.*;
import in.gharsetu.auth.CurrentUser;
import in.gharsetu.auth.UserStatus;
import in.gharsetu.common.PageResponse;
import in.gharsetu.promotion.PromotionController.PackageView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService service;

    @GetMapping("/stats")
    public Stats stats() {
        return service.stats();
    }

    @GetMapping("/properties/pending")
    public PageResponse<ModerationItem> pending(@RequestParam(defaultValue = "0") int page) {
        return service.moderationQueue(page);
    }

    @PostMapping("/properties/{id}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable Long id, @Valid @RequestBody(required = false) Decision d) {
        service.approve(CurrentUser.require(), id, d);
    }

    @PostMapping("/properties/{id}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable Long id, @Valid @RequestBody Decision d) {
        service.reject(CurrentUser.require(), id, d);
    }

    @PostMapping("/properties/{id}/promotions")
    public Map<String, Instant> feature(@PathVariable Long id, @Valid @RequestBody FeatureRequest req) {
        return Map.of("featuredUntil", service.feature(CurrentUser.require(), id, req));
    }

    @PostMapping("/properties/{id}/contact-verified")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void contactVerified(@PathVariable Long id, @RequestParam boolean value) {
        service.markContactVerified(CurrentUser.require(), id, value);
    }

    @GetMapping("/reports")
    public PageResponse<ReportItem> reports(@RequestParam(defaultValue = "0") int page) {
        return service.openReports(page);
    }

    @PostMapping("/reports/{id}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolve(@PathVariable Long id, @Valid @RequestBody ResolveReport req) {
        service.resolveReport(CurrentUser.require(), id, req);
    }

    @GetMapping("/users")
    public PageResponse<UserItem> users(@RequestParam(required = false) String q,
                                        @RequestParam(defaultValue = "0") int page) {
        return service.users(q, page);
    }

    @PostMapping("/users/{id}/suspend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suspend(@PathVariable Long id) {
        service.setUserStatus(CurrentUser.require(), id, UserStatus.SUSPENDED);
    }

    @PostMapping("/users/{id}/reinstate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reinstate(@PathVariable Long id) {
        service.setUserStatus(CurrentUser.require(), id, UserStatus.ACTIVE);
    }

    @GetMapping("/promotion-packages")
    public List<PackageView> packages() {
        return service.allPackages();
    }

    @PostMapping("/promotion-packages")
    @ResponseStatus(HttpStatus.CREATED)
    public PackageView createPackage(@Valid @RequestBody PackageRequest req) {
        return service.savePackage(CurrentUser.require(), null, req);
    }

    @PutMapping("/promotion-packages/{id}")
    public PackageView updatePackage(@PathVariable Long id, @Valid @RequestBody PackageRequest req) {
        return service.savePackage(CurrentUser.require(), id, req);
    }

    @GetMapping("/audit-logs")
    public PageResponse<AuditItem> audit(@RequestParam(defaultValue = "0") int page) {
        return service.auditLogs(page);
    }
}
