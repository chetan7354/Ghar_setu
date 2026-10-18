package in.gharsetu.visit;

import in.gharsetu.auth.CurrentUser;
import in.gharsetu.common.PageResponse;
import in.gharsetu.visit.SiteVisitService.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SiteVisitController {
    private final SiteVisitService service;

    @PostMapping("/properties/{id}/visits")
    @ResponseStatus(HttpStatus.CREATED)
    public VisitView request(@PathVariable Long id, @Valid @RequestBody CreateVisit req) {
        return service.request(CurrentUser.require(), id, req);
    }

    @PostMapping("/visits/{id}/accept")
    public VisitView accept(@PathVariable Long id, @Valid @RequestBody(required = false) OwnerDecision d) {
        return service.accept(CurrentUser.require(), id, d);
    }

    @PostMapping("/visits/{id}/reject")
    public VisitView reject(@PathVariable Long id, @Valid @RequestBody(required = false) OwnerDecision d) {
        return service.reject(CurrentUser.require(), id, d);
    }

    @PostMapping("/visits/{id}/propose")
    public VisitView propose(@PathVariable Long id, @Valid @RequestBody Proposal p) {
        return service.propose(CurrentUser.require(), id, p);
    }

    @PostMapping("/visits/{id}/accept-proposal")
    public VisitView acceptProposal(@PathVariable Long id) {
        return service.acceptProposal(CurrentUser.require(), id);
    }

    @PostMapping("/visits/{id}/cancel")
    public VisitView cancel(@PathVariable Long id) {
        return service.cancel(CurrentUser.require(), id);
    }

    @PostMapping("/visits/{id}/complete")
    public VisitView complete(@PathVariable Long id) {
        return service.complete(CurrentUser.require(), id);
    }

    @GetMapping("/me/visits/received")
    public PageResponse<VisitView> received(@RequestParam(defaultValue = "0") int page) {
        return service.received(CurrentUser.require(), page);
    }

    @GetMapping("/me/visits/requested")
    public PageResponse<VisitView> requested(@RequestParam(defaultValue = "0") int page) {
        return service.requested(CurrentUser.require(), page);
    }
}
