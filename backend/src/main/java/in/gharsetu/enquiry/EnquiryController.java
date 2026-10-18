package in.gharsetu.enquiry;

import in.gharsetu.auth.CurrentUser;
import in.gharsetu.common.PageResponse;
import in.gharsetu.enquiry.EnquiryService.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EnquiryController {
    private final EnquiryService service;

    @PostMapping("/properties/{id}/enquiries")
    @ResponseStatus(HttpStatus.CREATED)
    public EnquiryView create(@PathVariable Long id, @Valid @RequestBody CreateEnquiry req) {
        return service.create(CurrentUser.require(), id, req);
    }

    @PostMapping("/enquiries/{id}/reply")
    public EnquiryView reply(@PathVariable Long id, @Valid @RequestBody Reply req) {
        return service.reply(CurrentUser.require(), id, req);
    }

    @GetMapping("/me/enquiries/received")
    public PageResponse<EnquiryView> received(@RequestParam(defaultValue = "0") int page) {
        return service.received(CurrentUser.require(), page);
    }

    @GetMapping("/me/enquiries/sent")
    public PageResponse<EnquiryView> sent(@RequestParam(defaultValue = "0") int page) {
        return service.sent(CurrentUser.require(), page);
    }
}
