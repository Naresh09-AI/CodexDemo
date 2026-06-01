package com.example.usermanagement.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.usermanagement.dto.UserCreateRequest;
import com.example.usermanagement.dto.UserResponse;
import com.example.usermanagement.dto.UserUpdateRequest;
import com.example.usermanagement.config.SecurityConfig;
import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import com.example.usermanagement.exception.DuplicateResourceException;
import com.example.usermanagement.exception.ResourceNotFoundException;
import com.example.usermanagement.security.JwtAuthenticationFilter;
import com.example.usermanagement.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
class UserControllerTest {

    private static final Long USER_ID = 1L;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void createUserShouldReturnCreatedResponse() throws Exception {
        UserCreateRequest request = createRequest();
        UserResponse response = userResponse();

        when(userService.createUser(any(UserCreateRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(USER_ID))
                .andExpect(jsonPath("$.firstName").value("Ava"))
                .andExpect(jsonPath("$.email").value("ava.patel@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void createUserShouldReturnBadRequestWhenRequestIsInvalid() throws Exception {
        String request = """
                {
                  "firstName": "",
                  "lastName": "Patel",
                  "email": "not-an-email",
                  "password": "SecurePass123!",
                  "phone": "5551234567",
                  "status": "ACTIVE",
                  "role": "USER"
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.validationErrors.firstName").value("First name is required"))
                .andExpect(jsonPath("$.validationErrors.email").value("Email must be valid"));
    }

    @Test
    void createUserShouldReturnConflictWhenEmailAlreadyExists() throws Exception {
        UserCreateRequest request = createRequest();

        when(userService.createUser(any(UserCreateRequest.class)))
                .thenThrow(new DuplicateResourceException("User already exists with email: ava.patel@example.com"));

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("User already exists with email: ava.patel@example.com"));
    }

    @Test
    void createUserShouldReturnBadRequestWhenStatusIsInvalid() throws Exception {
        String request = """
                {
                  "firstName": "Ava",
                  "lastName": "Patel",
                  "email": "ava.patel@example.com",
                  "password": "SecurePass123!",
                  "phone": "5551234567",
                  "status": "UNKNOWN",
                  "role": "USER"
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid value provided for field: status"));
    }

    @Test
    void getUserByIdShouldReturnUserWhenFound() throws Exception {
        when(userService.getUserById(USER_ID)).thenReturn(userResponse());

        mockMvc.perform(get("/api/v1/users/{id}", USER_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(USER_ID))
                .andExpect(jsonPath("$.lastName").value("Patel"));
    }

    @Test
    void getUserByIdShouldReturnNotFoundWhenMissing() throws Exception {
        when(userService.getUserById(USER_ID))
                .thenThrow(new ResourceNotFoundException("User not found with id: " + USER_ID));

        mockMvc.perform(get("/api/v1/users/{id}", USER_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found with id: " + USER_ID));
    }

    @Test
    void getAllUsersShouldReturnPagedUsers() throws Exception {
        Page<UserResponse> page = new PageImpl<>(
                List.of(userResponse()),
                PageRequest.of(0, 5),
                1);

        when(userService.getAllUsers(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/users")
                        .param("page", "0")
                        .param("size", "5")
                        .param("sort", "email,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].email").value("ava.patel@example.com"))
                .andExpect(jsonPath("$.pageable.pageNumber").value(0))
                .andExpect(jsonPath("$.pageable.pageSize").value(5));

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userService).getAllUsers(pageableCaptor.capture());

        Pageable pageable = pageableCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(pageable.getPageNumber()).isZero();
        org.assertj.core.api.Assertions.assertThat(pageable.getPageSize()).isEqualTo(5);
        org.assertj.core.api.Assertions.assertThat(pageable.getSort().getOrderFor("email").isAscending()).isTrue();
    }

    @Test
    void updateUserShouldReturnUpdatedUser() throws Exception {
        UserUpdateRequest request = updateRequest();
        UserResponse response = updatedUserResponse();

        when(userService.updateUser(eq(USER_ID), any(UserUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/users/{id}", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(USER_ID))
                .andExpect(jsonPath("$.lastName").value("Rao"))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void updateUserShouldReturnBadRequestWhenRequestIsInvalid() throws Exception {
        String request = """
                {
                  "firstName": "Ava",
                  "lastName": "",
                  "email": "ava.rao@example.com",
                  "phone": "5557654321"
                }
                """;

        mockMvc.perform(put("/api/v1/users/{id}", USER_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.validationErrors.lastName").value("Last name is required"))
                .andExpect(jsonPath("$.validationErrors.status").value("Status is required"));
    }

    @Test
    void deleteUserShouldReturnNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/users/{id}", USER_ID))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(USER_ID);
    }

    @Test
    void deleteUserShouldReturnNotFoundWhenMissing() throws Exception {
        doThrow(new ResourceNotFoundException("User not found with id: " + USER_ID))
                .when(userService)
                .deleteUser(USER_ID);

        mockMvc.perform(delete("/api/v1/users/{id}", USER_ID))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found with id: " + USER_ID));
    }

    private UserCreateRequest createRequest() {
        return UserCreateRequest.builder()
                .firstName("Ava")
                .lastName("Patel")
                .email("ava.patel@example.com")
                .password("SecurePass123!")
                .phone("5551234567")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .build();
    }

    private UserUpdateRequest updateRequest() {
        return UserUpdateRequest.builder()
                .firstName("Ava")
                .lastName("Rao")
                .email("ava.rao@example.com")
                .phone("5557654321")
                .status(UserStatus.INACTIVE)
                .role(UserRole.USER)
                .build();
    }

    private UserResponse userResponse() {
        return UserResponse.builder()
                .id(USER_ID)
                .firstName("Ava")
                .lastName("Patel")
                .email("ava.patel@example.com")
                .phone("5551234567")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .createdAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();
    }

    private UserResponse updatedUserResponse() {
        return UserResponse.builder()
                .id(USER_ID)
                .firstName("Ava")
                .lastName("Rao")
                .email("ava.rao@example.com")
                .phone("5557654321")
                .status(UserStatus.INACTIVE)
                .role(UserRole.USER)
                .createdAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 2, 10, 0))
                .build();
    }

    @TestConfiguration
    static class JwtFilterTestConfig {

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter() {
            return new JwtAuthenticationFilter(null, null);
        }
    }
}
