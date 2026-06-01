package com.example.usermanagement.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.usermanagement.entity.User;
import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void generateTokenShouldCreateValidTokenForUser() {
        JwtService jwtService = jwtService(60);
        User user = user();
        AppUserDetails userDetails = new AppUserDetails(user);

        String token = jwtService.generateToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractUsername(token)).isEqualTo(user.getEmail());
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    void isTokenValidShouldReturnFalseWhenTokenIsTampered() {
        JwtService jwtService = jwtService(60);
        User user = user();
        String token = jwtService.generateToken(user);
        String tamperedToken = token.substring(0, token.length() - 2) + "xx";

        assertThat(jwtService.isTokenValid(tamperedToken, new AppUserDetails(user))).isFalse();
    }

    @Test
    void isTokenValidShouldReturnFalseWhenTokenIsExpired() {
        JwtService jwtService = jwtService(0);
        User user = user();
        String token = jwtService.generateToken(user);

        assertThat(jwtService.isTokenValid(token, new AppUserDetails(user))).isFalse();
    }

    @Test
    void extractUsernameShouldReturnNullForMalformedToken() {
        JwtService jwtService = jwtService(60);

        assertThat(jwtService.extractUsername("not-a-jwt")).isNull();
    }

    private JwtService jwtService(long expirationMinutes) {
        return new JwtService(
                new ObjectMapper(),
                "test-secret-key-that-is-long-enough-for-hmac",
                expirationMinutes);
    }

    private User user() {
        return User.builder()
                .id(1L)
                .firstName("Mira")
                .lastName("Chen")
                .email("mira.chen@example.com")
                .password("$2a$10$encodedPassword")
                .phone("5551230000")
                .status(UserStatus.ACTIVE)
                .role(UserRole.USER)
                .build();
    }
}
