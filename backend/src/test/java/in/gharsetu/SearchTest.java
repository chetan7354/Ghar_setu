package in.gharsetu;

import in.gharsetu.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SearchTest extends IntegrationTest {
    long cheapThatipur, midMorar, priceyThatipur, plot;

    @BeforeEach
    void seed() throws Exception {
        Account s = register("SELLER");
        cheapThatipur = createApprovedListing(s, "Compact flat in Thatipur colony", 2_000_000, 2);
        var morar = propertyBody("Three bedroom flat in Morar township", 4_500_000, 4);
        morar.put("bedrooms", 3);
        morar.put("furnishing", "FULLY_FURNISHED");
        midMorar = createListing(s, morar);
        mvc.perform(authed(post("/api/v1/admin/properties/" + midMorar + "/approve"), adminToken()));
        var big = propertyBody("Big four bedroom flat in Thatipur", 9_000_000, 2);
        big.put("bedrooms", 4);
        big.put("builtUpArea", 2400);
        big.put("possession", "UNDER_CONSTRUCTION");
        priceyThatipur = createListing(s, big);
        mvc.perform(authed(post("/api/v1/admin/properties/" + priceyThatipur + "/approve"), adminToken()));
        var p = propertyBody("Corner plot on Jhansi Road for sale", 3_000_000, 8);
        p.put("propertyType", "PLOT");
        p.put("plotArea", 200);
        p.put("areaUnit", "SQYD");
        plot = createListing(s, p);
        mvc.perform(authed(post("/api/v1/admin/properties/" + plot + "/approve"), adminToken()));
    }

    @Test
    void filtersByLocalityPriceBedroomsAndArea() throws Exception {
        mvc.perform(get("/api/v1/properties").param("city", "gwalior").param("locality", "thatipur"))
                .andExpect(jsonPath("$.totalItems").value(2));
        mvc.perform(get("/api/v1/properties").param("minPrice", "3000000").param("maxPrice", "5000000"))
                .andExpect(jsonPath("$.items[*].id", containsInAnyOrder((int) midMorar, (int) plot)));
        mvc.perform(get("/api/v1/properties").param("minBedrooms", "3"))
                .andExpect(jsonPath("$.items[*].id", containsInAnyOrder((int) midMorar, (int) priceyThatipur)));
        mvc.perform(get("/api/v1/properties").param("minArea", "1500"))  // plot = 1800 sqft, big flat = 2400
                .andExpect(jsonPath("$.items[*].id", containsInAnyOrder((int) priceyThatipur, (int) plot)));
        mvc.perform(get("/api/v1/properties").param("category", "LAND"))
                .andExpect(jsonPath("$.items[*].id", contains((int) plot)));
        mvc.perform(get("/api/v1/properties").param("furnishing", "FULLY_FURNISHED"))
                .andExpect(jsonPath("$.items[*].id", contains((int) midMorar)));
        mvc.perform(get("/api/v1/properties").param("possession", "UNDER_CONSTRUCTION"))
                .andExpect(jsonPath("$.items[*].id", contains((int) priceyThatipur)));
        mvc.perform(get("/api/v1/properties").param("q", "morar"))
                .andExpect(jsonPath("$.items[*].id", contains((int) midMorar)));
    }

    @Test
    void sortsAndPaginates() throws Exception {
        mvc.perform(get("/api/v1/properties").param("sort", "price_asc"))
                .andExpect(jsonPath("$.items[0].id").value(cheapThatipur))
                .andExpect(jsonPath("$.items[3].id").value(priceyThatipur));
        mvc.perform(get("/api/v1/properties").param("sort", "price_desc").param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.items[*].id", contains((int) plot, (int) cheapThatipur)))
                .andExpect(jsonPath("$.totalItems").value(4))
                .andExpect(jsonPath("$.totalPages").value(2));
    }

    @Test
    void featuredListingsComeFirstAndCanBeFiltered() throws Exception {
        String admin = adminToken();
        Long pkg = jdbc.queryForObject("select id from promotion_packages where code='FEATURED_7'", Long.class);
        mvc.perform(authed(post("/api/v1/admin/properties/" + cheapThatipur + "/promotions"), admin)
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("packageId", pkg))))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/properties")).andExpect(jsonPath("$.items[0].id").value(cheapThatipur))
                .andExpect(jsonPath("$.items[0].featured").value(true));
        mvc.perform(get("/api/v1/properties").param("featured", "true"))
                .andExpect(jsonPath("$.items[*].id", contains((int) cheapThatipur)));
        mvc.perform(get("/api/v1/properties/featured")).andExpect(jsonPath("$[*].id", contains((int) cheapThatipur)));
    }

    @Test
    void verifiedFilterUsesContactVerificationRecord() throws Exception {
        mvc.perform(get("/api/v1/properties").param("verified", "true")).andExpect(jsonPath("$.totalItems").value(0));
        mvc.perform(authed(post("/api/v1/admin/properties/" + midMorar + "/contact-verified").param("value", "true"), adminToken()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/properties").param("verified", "true"))
                .andExpect(jsonPath("$.items[*].id", contains((int) midMorar)))
                .andExpect(jsonPath("$.items[0].trust.contactVerified").value(true))
                .andExpect(jsonPath("$.items[0].trust.ownershipDocumentsReviewed").value(false));
    }

    @Test
    void rejectsInvalidRanges() throws Exception {
        mvc.perform(get("/api/v1/properties").param("minPrice", "5000000").param("maxPrice", "1000000"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/properties").param("type", "CASTLE")).andExpect(status().isBadRequest());
    }
}
