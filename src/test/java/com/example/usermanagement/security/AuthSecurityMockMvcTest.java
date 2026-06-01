package com.example.usermanagement.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.usermanagement.dto.AuthResponse;
import com.example.usermanagement.dto.LoginRequest;
import com.example.usermanagement.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthSecurityMockMvcTest {

    private static final AtomicInteger EMAIL_COUNTER = new AtomicInteger();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registerShouldCreatePublicUserWithUserRole() throws Exception {
        RegisterRequest request = registerRequest(nextEmail());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(request.email()))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void loginShouldReturnJwtForRegisteredUser() throws Exception {
        RegisterRequest request = registerRequest(nextEmail());
        register(request);

        AuthResponse response = login(request.email(), request.password());

        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.token()).isNotBlank();
        assertThat(response.user().email()).isEqualTo(request.email());
    }

    @Test
    void meShouldReturnCurrentUserWhenBearerTokenIsValid() throws Exception {
        RegisterRequest request = registerRequest(nextEmail());
        register(request);
        AuthResponse loginResponse = login(request.email(), request.password());

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginResponse.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(request.email()))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void meShouldReturnUnauthorizedWithoutBearerToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void adminOnlyEndpointShouldReturnForbiddenForUserRole() throws Exception {
        RegisterRequest request = registerRequest(nextEmail());
        register(request);
        AuthResponse loginResponse = login(request.email(), request.password());

        mockMvc.perform(get("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + loginResponse.token()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void adminOnlyEndpointShouldReturnOkForSeededAdmin() throws Exception {
        AuthResponse adminLogin = login("admin@example.com", "AdminPass123!");

        mockMvc.perform(get("/api/v1/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminLogin.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void loginShouldReturnUnauthorizedForInvalidPassword() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("admin@example.com")
                .password("wrong-password")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    private void register(RegisterRequest request) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private AuthResponse login(String email, String password) throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readValue(result.getResponse().getContentAsByteArray(), AuthResponse.class);
    }

    private RegisterRequest registerRequest(String email) {
        return RegisterRequest.builder()
                .firstName("Mira")
                .lastName("Chen")
                .email(email)
                .password("SecurePass123!")
                .phone("5551230000")
                .build();
    }

    private String nextEmail() {
        return "mira." + EMAIL_COUNTER.incrementAndGet() + "@example.com";
    }
}
