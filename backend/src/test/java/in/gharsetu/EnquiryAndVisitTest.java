package in.gharsetu;

import in.gharsetu.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class EnquiryAndVisitTest extends IntegrationTest {
    Account owner, buyer, stranger;
    long propertyId;

    @BeforeEach
    void seed() throws Exception {
        owner = register("SELLER");
        buyer = register("BUYER");
        stranger = register("BUYER");
        propertyId = createApprovedListing(owner, "Two bedroom flat in Gola Ka Mandir", 2_800_000, 6);
    }

    @Test
    void enquiryReachesOwnerAndRevealsPhoneToBuyer() throws Exception {
        mvc.perform(get("/api/v1/properties/" + propertyId)).andExpect(jsonPath("$.owner.phoneHidden").value(true));

        mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/enquiries"), buyer.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("message", "Is the price negotiable? I can visit on Sunday.", "sharePhone", true))))
                .andExpect(status().isCreated());

        mvc.perform(authed(get("/api/v1/me/enquiries/received"), owner.token()))
                .andExpect(jsonPath("$.items[0].counterpartPhone").value(buyer.phone()))
                .andExpect(jsonPath("$.items[0].status").value("READ"));
        mvc.perform(authed(get("/api/v1/properties/" + propertyId), buyer.token()))
                .andExpect(jsonPath("$.owner.phone").value(owner.phone()));
        mvc.perform(authed(get("/api/v1/properties/" + propertyId), stranger.token()))
                .andExpect(jsonPath("$.owner.phoneHidden").value(true));

        mvc.perform(authed(get("/api/v1/me/enquiries/received"), stranger.token()))
                .andExpect(jsonPath("$.totalItems").value(0));
    }

    @Test
    void enquiryRulesAndReply() throws Exception {
        mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/enquiries"), owner.token())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("message", "Enquiring on my own listing", "sharePhone", true))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/properties/" + propertyId + "/enquiries")
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("message", "Anonymous enquiry text", "sharePhone", true))))
                .andExpect(status().isUnauthorized());

        long enquiryId = 0;
        for (int i = 0; i < 3; i++) {
            enquiryId = body(mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/enquiries"), buyer.token())
                    .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("message", "Hello, is this still available?", "sharePhone", false))))
                    .andExpect(status().isCreated())).get("id").asLong();
        }
        mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/enquiries"), buyer.token())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("message", "Hello, is this still available?", "sharePhone", false))))
                .andExpect(status().isBadRequest());

        mvc.perform(authed(post("/api/v1/enquiries/" + enquiryId + "/reply"), stranger.token())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("reply", "Not my listing")))).andExpect(status().isForbidden());
        mvc.perform(authed(post("/api/v1/enquiries/" + enquiryId + "/reply"), owner.token())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("reply", "Yes, available. Call me."))))
                .andExpect(status().isOk());
        mvc.perform(authed(get("/api/v1/me/enquiries/sent"), buyer.token()))
                .andExpect(jsonPath("$.items[0].ownerReply").value("Yes, available. Call me."))
                .andExpect(jsonPath("$.items[0].status").value("REPLIED"));
    }

    private long requestVisit(Instant at) throws Exception {
        return body(mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/visits"), buyer.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("preferredAt", at.toString(), "note", "Evening works best"))))
                .andExpect(status().isCreated())).get("id").asLong();
    }

    @Test
    void fullVisitWorkflowWithReschedule() throws Exception {
        Instant preferred = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        long visitId = requestVisit(preferred);

        // Only one open request per buyer per property
        mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/visits"), buyer.token())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("preferredAt", preferred.toString()))))
                .andExpect(status().isConflict());

        mvc.perform(authed(get("/api/v1/me/visits/received"), owner.token()))
                .andExpect(jsonPath("$.items[0].status").value("REQUESTED"))
                .andExpect(jsonPath("$.items[0].counterpartPhone").doesNotExist());

        // Buyer cannot accept on the owner's behalf; stranger cannot touch it
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/accept"), buyer.token())).andExpect(status().isForbidden());
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/cancel"), stranger.token())).andExpect(status().isForbidden());

        Instant proposed = preferred.plus(1, ChronoUnit.DAYS);
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/propose"), owner.token())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("proposedAt", proposed.toString(), "note", "Next day please"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RESCHEDULE_PROPOSED"));

        // Owner cannot accept their own proposal through the buyer endpoint
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/accept-proposal"), owner.token())).andExpect(status().isForbidden());

        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/accept-proposal"), buyer.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.scheduledAt", startsWith(proposed.toString().substring(0, 13))))
                .andExpect(jsonPath("$.counterpartPhone").value(owner.phone()));

        // Cannot complete before the scheduled time
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/complete"), owner.token())).andExpect(status().isBadRequest());
        jdbc.update("update site_visit_requests set proposed_at = ? where id = ?",
                java.sql.Timestamp.from(Instant.now().minus(1, ChronoUnit.HOURS)), visitId);
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/complete"), owner.token()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));

        // Terminal state
        mvc.perform(authed(post("/api/v1/visits/" + visitId + "/cancel"), buyer.token())).andExpect(status().isConflict());

        List<String> trail = jdbc.queryForList(
                "select action from audit_logs where entity_type='SITE_VISIT' and entity_id=? order by id", String.class, visitId);
        assertThat(trail).containsExactly("VISIT_REQUESTED", "VISIT_RESCHEDULE_PROPOSED", "VISIT_PROPOSAL_ACCEPTED", "VISIT_COMPLETED");
    }

    @Test
    void rejectAndCancelPaths() throws Exception {
        long v1 = requestVisit(Instant.now().plus(3, ChronoUnit.DAYS));
        mvc.perform(authed(post("/api/v1/visits/" + v1 + "/reject"), owner.token())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("note", "Already in talks"))))
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(authed(post("/api/v1/visits/" + v1 + "/accept"), owner.token())).andExpect(status().isConflict());

        long v2 = requestVisit(Instant.now().plus(4, ChronoUnit.DAYS));
        mvc.perform(authed(post("/api/v1/visits/" + v2 + "/cancel"), buyer.token()))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void visitTimeMustBeReasonable() throws Exception {
        mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/visits"), buyer.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("preferredAt", Instant.now().plus(200, ChronoUnit.DAYS).toString()))))
                .andExpect(status().isBadRequest());
        mvc.perform(authed(post("/api/v1/properties/" + propertyId + "/visits"), buyer.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("preferredAt", Instant.now().minus(1, ChronoUnit.DAYS).toString()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void favourites() throws Exception {
        mvc.perform(authed(put("/api/v1/properties/" + propertyId + "/favourite"), buyer.token())).andExpect(status().isNoContent());
        mvc.perform(authed(put("/api/v1/properties/" + propertyId + "/favourite"), buyer.token())).andExpect(status().isNoContent());
        mvc.perform(authed(get("/api/v1/me/favourites"), buyer.token()))
                .andExpect(jsonPath("$.items[*].id", contains((int) propertyId)));
        mvc.perform(authed(get("/api/v1/properties/" + propertyId), buyer.token())).andExpect(jsonPath("$.favourited").value(true));
        mvc.perform(authed(delete("/api/v1/properties/" + propertyId + "/favourite"), buyer.token())).andExpect(status().isNoContent());
        mvc.perform(authed(get("/api/v1/me/favourites"), buyer.token())).andExpect(jsonPath("$.items", hasSize(0)));
    }
}
