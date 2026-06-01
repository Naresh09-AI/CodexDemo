package com.example.usermanagement.dto;

import lombok.Builder;

@Builder
public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
}
