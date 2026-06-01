package com.example.usermanagement.dto;

import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        UserStatus status,
        UserRole role,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
