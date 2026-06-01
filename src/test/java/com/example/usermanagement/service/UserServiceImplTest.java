package com.example.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.usermanagement.dto.UserCreateRequest;
import com.example.usermanagement.dto.UserResponse;
import com.example.usermanagement.dto.UserUpdateRequest;
import com.example.usermanagement.entity.User;
import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import com.example.usermanagement.exception.DuplicateResourceException;
import com.example.usermanagement.exception.ResourceNotFoundException;
import com.example.usermanagement.mapper.UserMapper;
import com.example.usermanagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    private static final Long USER_ID = 1L;
    private static final String EMAIL = "ava.patel@example.com";

    @Mock
    private UserRepository userRepository;

    private UserServiceImpl userService;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        userService = new UserServiceImpl(userRepository, new UserMapper(), passwordEncoder);
    }

    @Test
    void createUserShouldReturnCreatedUserWhenEmailIsAvailable() {
        UserCreateRequest request = createRequest();
        User savedUser = user();

        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UserResponse response = userService.createUser(request);

        assertThat(response).isEqualTo(userResponse());
        verify(userRepository).existsByEmail(EMAIL);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUserShouldThrowDuplicateResourceExceptionWhenEmailExists() {
        UserCreateRequest request = createRequest();
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("User already exists with email: " + EMAIL);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserByIdShouldReturnUserWhenFound() {
        User user = user();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        UserResponse response = userService.getUserById(USER_ID);

        assertThat(response).isEqualTo(userResponse());
        verify(userRepository).findById(USER_ID);
    }

    @Test
    void getUserByIdShouldThrowResourceNotFoundExceptionWhenMissing() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with id: " + USER_ID);

        verify(userRepository).findById(USER_ID);
    }

    @Test
    void getAllUsersShouldReturnMappedPage() {
        Pageable pageable = PageRequest.of(0, 10);
        User user = user();

        when(userRepository.findAll(pageable)).thenReturn(new PageImpl<>(List.of(user), pageable, 1));

        Page<UserResponse> response = userService.getAllUsers(pageable);

        assertThat(response.getContent()).containsExactly(userResponse());
        assertThat(response.getTotalElements()).isEqualTo(1);
    }

    @Test
    void updateUserShouldReturnUpdatedUserWhenEmailBelongsToSameUser() {
        UserUpdateRequest request = updateRequest();
        User existingUser = user();
        User updatedUser = updatedUser();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existingUser));
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(updatedUser);

        UserResponse response = userService.updateUser(USER_ID, request);

        assertThat(response).isEqualTo(updatedUserResponse());
        verify(userRepository).save(existingUser);
    }

    @Test
    void updateUserShouldThrowResourceNotFoundExceptionWhenUserDoesNotExist() {
        UserUpdateRequest request = updateRequest();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(USER_ID, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with id: " + USER_ID);

        verify(userRepository, never()).findByEmail(any(String.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUserShouldThrowDuplicateResourceExceptionWhenEmailBelongsToAnotherUser() {
        UserUpdateRequest request = updateRequest();
        User existingUser = user();
        User otherUser = User.builder()
                .id(99L)
                .email(request.email())
                .build();

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existingUser));
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> userService.updateUser(USER_ID, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessage("User already exists with email: " + request.email());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUserShouldDeleteWhenUserExists() {
        User user = user();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        userService.deleteUser(USER_ID);

        verify(userRepository).delete(user);
    }

    @Test
    void deleteUserShouldThrowResourceNotFoundExceptionWhenMissing() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found with id: " + USER_ID);

        verify(userRepository, never()).delete(any(User.class));
    }

    private UserCreateRequest createRequest() {
        return UserCreateRequest.builder()
                .firstName("Ava")
                .lastName("Patel")
                .email(EMAIL)
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

    private User user() {
        return User.builder()
                .id(USER_ID)
                .firstName("Ava")
                .lastName("Patel")
                .email(EMAIL)
                .password("$2a$10$encodedPassword")
                .phone("5551234567")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .createdAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .build();
    }

    private User updatedUser() {
        return User.builder()
                .id(USER_ID)
                .firstName("Ava")
                .lastName("Rao")
                .email("ava.rao@example.com")
                .password("$2a$10$encodedPassword")
                .phone("5557654321")
                .status(UserStatus.INACTIVE)
                .role(UserRole.USER)
                .createdAt(LocalDateTime.of(2026, 1, 1, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 1, 2, 10, 0))
                .build();
    }

    private UserResponse userResponse() {
        return UserResponse.builder()
                .id(USER_ID)
                .firstName("Ava")
                .lastName("Patel")
                .email(EMAIL)
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
}
