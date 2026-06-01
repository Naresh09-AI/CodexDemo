package com.example.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.usermanagement.dto.AuthResponse;
import com.example.usermanagement.dto.LoginRequest;
import com.example.usermanagement.dto.RegisterRequest;
import com.example.usermanagement.dto.UserResponse;
import com.example.usermanagement.entity.User;
import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import com.example.usermanagement.exception.DuplicateResourceException;
import com.example.usermanagement.exception.ResourceNotFoundException;
import com.example.usermanagement.mapper.UserMapper;
import com.example.usermanagement.repository.UserRepository;
import com.example.usermanagement.security.AppUserDetails;
import com.example.usermanagement.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String EMAIL = "mira.chen@example.com";
    private static final String RAW_PASSWORD = "SecurePass123!";

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthServiceImpl authService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        JwtService jwtService = new JwtService(
                new ObjectMapper(),
                "test-secret-key-that-is-long-enough-for-hmac",
                60);
        authService = new AuthServiceImpl(
                userRepository,
                new UserMapper(),
                passwordEncoder,
                authenticationManager,
                jwtService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void registerShouldCreateUserWithUserRoleAndEncodedPassword() {
        RegisterRequest request = registerRequest();
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            user.setCreatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));
            user.setUpdatedAt(LocalDateTime.of(2026, 1, 1, 10, 0));
            return user;
        });

        UserResponse response = authService.register(request);

        assertThat(response.email()).isEqualTo(EMAIL);
        assertThat(response.role()).isEqualTo(UserRole.USER);
        assertThat(response.status()).isEqualTo(UserStatus.ACTIVE);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getRole()).isEqualTo(UserRole.USER);
        assertThat(savedUser.getPassword()).isNotEqualTo(RAW_PASSWORD);
        assertThat(passwordEncoder.matches(RAW_PASSWORD, savedUser.getPassword())).isTrue();
    }

    @Test
    void registerShouldThrowDuplicateResourceExceptionWhenEmailExists() {
        RegisterRequest request = registerRequest();
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("User already exists with email: " + EMAIL);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void loginShouldAuthenticateAndReturnBearerToken() {
        LoginRequest request = loginRequest();
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isNotBlank();
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.user().email()).isEqualTo(EMAIL);
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void loginShouldThrowResourceNotFoundExceptionWhenAuthenticatedUserCannotBeLoaded() {
        LoginRequest request = loginRequest();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with email: " + EMAIL);
    }

    @Test
    void getCurrentUserShouldReturnAuthenticatedUser() {
        User user = user();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AppUserDetails(user),
                null,
                new AppUserDetails(user).getAuthorities()));

        UserResponse response = authService.getCurrentUser();

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.email()).isEqualTo(EMAIL);
    }

    @Test
    void getCurrentUserShouldThrowResourceNotFoundExceptionWhenAuthenticationIsMissing() {
        assertThatThrownBy(() -> authService.getCurrentUser())
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Authenticated user not found");
    }

    private RegisterRequest registerRequest() {
        return RegisterRequest.builder()
                .firstName("Mira")
                .lastName("Chen")
                .email(EMAIL)
                .password(RAW_PASSWORD)
                .phone("5551230000")
                .build();
    }

    private LoginRequest loginRequest() {
        return LoginRequest.builder()
                .email(EMAIL)
                .password(RAW_PASSWORD)
                .build();
    }

    private User user() {
        return User.builder()
                .id(1L)
                .firstName("Mira")
                .lastName("Chen")
                .email(EMAIL)
                .password(passwordEncoder.encode(RAW_PASSWORD))
                .phone("5551230000")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .createdAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();
    }
}
