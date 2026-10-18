package in.gharsetu;

import in.gharsetu.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthAndAccessTest extends IntegrationTest {

    @Test
    void registerHashesPasswordAndRejectsDuplicates() throws Exception {
        Account a = register("BUYER");
        String hash = jdbc.queryForObject("select password_hash from users where id = ?", String.class, a.id());
        org.assertj.core.api.Assertions.assertThat(hash).startsWith("$2").doesNotContain("Password@123");

        String email = jdbc.queryForObject("select email from users where id = ?", String.class, a.id());
        var dup = Map.of("fullName", "Someone Else", "email", email.toUpperCase(), "phone", "9123456780",
                "password", "Password@123", "accountType", "BUYER");
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(toJson(dup)))
                .andExpect(status().isConflict());
    }

    @Test
    void registrationValidatesInput() throws Exception {
        var bad = Map.of("fullName", "A", "email", "not-an-email", "phone", "12345",
                "password", "short", "accountType", "BUYER");
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(toJson(bad)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[*].field", hasItems("fullName", "email", "phone", "password")));
    }

    @Test
    void wrongPasswordIsUnauthorised() throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", "admin@test.local", "password", "wrong-password"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointsNeedLoginAndAdminEndpointsNeedAdmin() throws Exception {
        mvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/me").header("Authorization", "Bearer garbage")).andExpect(status().isUnauthorized());

        Account seller = register("SELLER");
        mvc.perform(authed(get("/api/v1/admin/stats"), seller.token())).andExpect(status().isForbidden());
        mvc.perform(authed(get("/api/v1/admin/stats"), adminToken())).andExpect(status().isOk())
                .andExpect(jsonPath("$.revenueNote", containsString("not integrated")));
    }

    @Test
    void buyerCannotCreateListingUntilBecomingSeller() throws Exception {
        Account buyer = register("BUYER");
        mvc.perform(authed(post("/api/v1/properties"), buyer.token()).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(propertyBody("Two bedroom flat in DD Nagar", 3_000_000, 3))))
                .andExpect(status().isForbidden());

        String newToken = body(mvc.perform(authed(post("/api/v1/me/become-seller"), buyer.token()))
                .andExpect(status().isOk())).get("token").asText();
        createListing(new Account(buyer.id(), newToken, buyer.phone()), propertyBody("Two bedroom flat in DD Nagar", 3_000_000, 3));
    }

    @Test
    void suspendedUserTokenStopsWorking() throws Exception {
        Account u = register("BUYER");
        mvc.perform(authed(get("/api/v1/me"), u.token())).andExpect(status().isOk());
        mvc.perform(authed(post("/api/v1/admin/users/" + u.id() + "/suspend"), adminToken()))
                .andExpect(status().isNoContent());
        mvc.perform(authed(get("/api/v1/me"), u.token())).andExpect(status().isUnauthorized());
    }
}
