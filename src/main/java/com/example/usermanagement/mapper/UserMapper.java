package com.example.usermanagement.mapper;

import com.example.usermanagement.dto.UserCreateRequest;
import com.example.usermanagement.dto.UserResponse;
import com.example.usermanagement.dto.UserUpdateRequest;
import com.example.usermanagement.entity.User;
import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public User toEntity(UserCreateRequest request, String encodedPassword) {
        return User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .password(encodedPassword)
                .phone(request.phone())
                .status(resolveStatus(request.status()))
                .role(resolveRole(request.role()))
                .build();
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(user.getStatus())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public void updateEntity(User user, UserUpdateRequest request) {
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setPhone(request.phone());
        user.setStatus(request.status());
        user.setRole(request.role());
    }

    private UserStatus resolveStatus(UserStatus status) {
        return status == null ? UserStatus.ACTIVE : status;
    }

    private UserRole resolveRole(UserRole role) {
        return role == null ? UserRole.USER : role;
    }
}
