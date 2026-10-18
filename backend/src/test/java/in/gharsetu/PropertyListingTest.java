package in.gharsetu;

import in.gharsetu.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PropertyListingTest extends IntegrationTest {

    @Test
    void newListingIsHiddenUntilApproved() throws Exception {
        Account seller = register("SELLER");
        long id = createListing(seller, propertyBody("Two bedroom flat near City Centre", 3_500_000, 1));

        mvc.perform(get("/api/v1/properties/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/properties?city=gwalior")).andExpect(jsonPath("$.totalItems").value(0));
        mvc.perform(authed(get("/api/v1/properties/" + id), seller.token())).andExpect(status().isOk())
                .andExpect(jsonPath("$.moderationStatus").value("PENDING"));

        mvc.perform(authed(post("/api/v1/admin/properties/" + id + "/approve"), adminToken()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/properties/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.owner.phoneHidden").value(true))
                .andExpect(jsonPath("$.owner.phone").doesNotExist());
    }

    @Test
    void otherUsersCannotEditOrDeleteAListing() throws Exception {
        Account owner = register("SELLER");
        Account other = register("SELLER");
        long id = createApprovedListing(owner, "Three bedroom flat in Morar", 4_000_000, 4);

        mvc.perform(authed(put("/api/v1/properties/" + id), other.token()).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(propertyBody("Hijacked title for this listing", 1_000_000, 4))))
                .andExpect(status().isForbidden());
        mvc.perform(authed(delete("/api/v1/properties/" + id), other.token())).andExpect(status().isForbidden());
        mvc.perform(authed(post("/api/v1/properties/" + id + "/mark-sold"), other.token())).andExpect(status().isForbidden());
    }

    @Test
    void editingSendsListingBackToModeration() throws Exception {
        Account owner = register("SELLER");
        long id = createApprovedListing(owner, "Three bedroom flat in Morar", 4_000_000, 4);
        mvc.perform(authed(put("/api/v1/properties/" + id), owner.token()).contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(propertyBody("Three bedroom flat in Morar, price cut", 3_800_000, 4))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.moderationStatus").value("PENDING"));
        mvc.perform(get("/api/v1/properties/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void typeSpecificValidation() throws Exception {
        Account owner = register("SELLER");
        var plot = propertyBody("Residential plot on Shivpuri Link Road", 2_000_000, 7);
        plot.put("propertyType", "PLOT");
        plot.remove("builtUpArea");
        mvc.perform(authed(post("/api/v1/properties"), owner.token()).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(plot))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Plot area")));
        plot.put("plotArea", 150);
        plot.put("areaUnit", "SQYD");
        long id = createListing(owner, plot);
        String areaSqft = jdbc.queryForObject("select area_sqft from properties where id = ?", String.class, id);
        org.assertj.core.api.Assertions.assertThat(areaSqft).isEqualTo("1350.00");
        Integer bedrooms = jdbc.queryForObject("select bedrooms from properties where id = ?", Integer.class, id);
        org.assertj.core.api.Assertions.assertThat(bedrooms).isNull();
    }

    @Test
    void statusTransitions() throws Exception {
        Account owner = register("SELLER");
        long id = createApprovedListing(owner, "Two bedroom flat in Lashkar", 2_500_000, 5);
        mvc.perform(authed(post("/api/v1/properties/" + id + "/activate"), owner.token())).andExpect(status().isBadRequest());
        mvc.perform(authed(post("/api/v1/properties/" + id + "/pause"), owner.token())).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/properties?city=gwalior")).andExpect(jsonPath("$.totalItems").value(0));
        mvc.perform(authed(post("/api/v1/properties/" + id + "/activate"), owner.token())).andExpect(status().isNoContent());
        mvc.perform(authed(post("/api/v1/properties/" + id + "/mark-sold"), owner.token())).andExpect(status().isNoContent());
        mvc.perform(authed(post("/api/v1/properties/" + id + "/activate"), owner.token())).andExpect(status().isBadRequest());
    }

    @Test
    void imageUploadChecksRealFileType() throws Exception {
        Account owner = register("SELLER");
        long id = createListing(owner, propertyBody("Two bedroom flat in Lashkar", 2_500_000, 5));
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
        mvc.perform(authed(multipart("/api/v1/properties/" + id + "/images")
                        .file(new MockMultipartFile("file", "a.png", "image/png", png)), owner.token()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.url", containsString("/uploads/properties/")));
        mvc.perform(authed(multipart("/api/v1/properties/" + id + "/images")
                        .file(new MockMultipartFile("file", "evil.jpg", "image/jpeg", "<?php echo 1;".getBytes())), owner.token()))
                .andExpect(status().isBadRequest());
        Account other = register("SELLER");
        mvc.perform(authed(multipart("/api/v1/properties/" + id + "/images")
                        .file(new MockMultipartFile("file", "a.png", "image/png", png)), other.token()))
                .andExpect(status().isForbidden());
    }

    @Test
    void duplicateListingIsFlaggedForModeration() throws Exception {
        Account owner = register("SELLER");
        long first = createListing(owner, propertyBody("Two bedroom flat in Thatipur", 3_000_000, 2));
        long second = createListing(owner, propertyBody("2BHK flat Thatipur, same one", 3_020_000, 2));
        Long dupOf = jdbc.queryForObject("select possible_duplicate_of from properties where id = ?", Long.class, second);
        org.assertj.core.api.Assertions.assertThat(dupOf).isEqualTo(first);
    }

    @Test
    void reportsCanBeFiledAnonymouslyAndResolvedByAdmin() throws Exception {
        Account owner = register("SELLER");
        long id = createApprovedListing(owner, "Two bedroom flat in Lashkar", 2_500_000, 5);
        long reportId = body(mvc.perform(post("/api/v1/properties/" + id + "/reports").contentType(MediaType.APPLICATION_JSON)
                .content(toJson(java.util.Map.of("reason", "BROKER_POSING_AS_OWNER", "details", "Asked me for brokerage"))))
                .andExpect(status().isCreated())).get("id").asLong();
        String admin = adminToken();
        mvc.perform(authed(get("/api/v1/admin/reports"), admin)).andExpect(jsonPath("$.items[0].id").value(reportId));
        mvc.perform(authed(post("/api/v1/admin/reports/" + reportId + "/resolve"), admin).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(java.util.Map.of("outcome", "ACTION_TAKEN", "pauseListing", true)))).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/properties/" + id)).andExpect(status().isNotFound());
        List<String> actions = jdbc.queryForList("select action from audit_logs where entity_type='REPORT'", String.class);
        org.assertj.core.api.Assertions.assertThat(actions).containsExactly("REPORT_RESOLVED");
    }
}
