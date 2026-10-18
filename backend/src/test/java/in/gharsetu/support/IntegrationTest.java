package in.gharsetu.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Full-stack tests against a real MySQL database (gharsetu_test), rebuilt from the migrations on startup. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(IntegrationTest.CleanMigrate.class)
public abstract class IntegrationTest {
    private static final AtomicInteger SEQ = new AtomicInteger((int) (System.nanoTime() % 100000));

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected JdbcTemplate jdbc;

    @TestConfiguration
    static class CleanMigrate {
        @Bean
        FlywayMigrationStrategy cleanMigrate() {
            return (Flyway f) -> {
                f.clean();
                f.migrate();
            };
        }
    }

    @BeforeEach
    void resetData() {
        jdbc.execute("SET FOREIGN_KEY_CHECKS=0");
        for (String t : new String[]{"audit_logs", "listing_promotions", "reported_listings", "site_visit_requests",
                "enquiries", "favourites", "property_amenities", "property_images", "properties"}) {
            jdbc.execute("TRUNCATE TABLE " + t);
        }
        jdbc.execute("DELETE ur FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE u.email <> 'admin@test.local'");
        jdbc.execute("DELETE FROM users WHERE email <> 'admin@test.local'");
        jdbc.execute("SET FOREIGN_KEY_CHECKS=1");
    }

    public record Account(long id, String token, String phone) {}

    protected Account register(String type) throws Exception {
        int n = SEQ.incrementAndGet();
        String phone = "9" + String.format("%09d", n);
        var body = Map.of("fullName", "Test User" + n + " Kumar", "email", "user" + n + "@example.com",
                "phone", phone, "password", "Password@123", "accountType", type);
        JsonNode res = body(mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body))).andExpect(status().isCreated()));
        return new Account(res.at("/user/id").asLong(), res.get("token").asText(), phone);
    }

    protected String adminToken() throws Exception {
        var body = Map.of("email", "admin@test.local", "password", "AdminTestPass#1");
        return body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body))).andExpect(status().isOk())).get("token").asText();
    }

    protected Map<String, Object> propertyBody(String title, long price, int localityId) {
        Map<String, Object> m = new HashMap<>();
        m.put("title", title);
        m.put("propertyType", "APARTMENT");
        m.put("price", price);
        m.put("priceNegotiable", false);
        m.put("builtUpArea", 1200);
        m.put("areaUnit", "SQFT");
        m.put("bedrooms", 2);
        m.put("bathrooms", 2);
        m.put("furnishing", "UNFURNISHED");
        m.put("propertyAgeYears", 3);
        m.put("possession", "READY");
        m.put("description", "Spacious flat with good ventilation, close to market and schools.");
        m.put("addressLine", "Main road");
        m.put("localityId", localityId);
        m.put("pinCode", "474011");
        m.put("contactPreference", "BOTH");
        m.put("showPhone", true);
        return m;
    }

    protected long createListing(Account seller, Map<String, Object> body) throws Exception {
        return body(mvc.perform(authed(post("/api/v1/properties"), seller.token())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isCreated())).get("id").asLong();
    }

    protected long createApprovedListing(Account seller, String title, long price, int localityId) throws Exception {
        long id = createListing(seller, propertyBody(title, price, localityId));
        mvc.perform(authed(post("/api/v1/admin/properties/" + id + "/approve"), adminToken()))
                .andExpect(status().isNoContent());
        return id;
    }

    protected static MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder b, String token) {
        return b.header("Authorization", "Bearer " + token);
    }

    protected JsonNode body(ResultActions r) throws Exception {
        String s = r.andReturn().getResponse().getContentAsString();
        return s.isEmpty() ? json.nullNode() : json.readTree(s);
    }

    protected String toJson(Object o) throws Exception {
        return json.writeValueAsString(o);
    }
}
