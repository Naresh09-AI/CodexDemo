package com.example.usermanagement.dto;

import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

@Builder
public record UserCreateRequest(
                @NotBlank(message = "First name is required") @Size(max = 100, message = "First name must not exceed 100 characters") String firstName,

                @NotBlank(message = "Last name is required") @Size(max = 100, message = "Last name must not exceed 100 characters") String lastName,

                @NotBlank(message = "Email is required") @Email(message = "Email must be valid") @Size(max = 150, message = "Email must not exceed 150 characters") String email,

                @NotBlank(message = "Password is required") @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters") String password,

                @NotBlank(message = "Phone is required") @Size(max = 10, message = "Phone must not exceed 10 characters") String phone,

                UserStatus status,

                UserRole role) {
}
