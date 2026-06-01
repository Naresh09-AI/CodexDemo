package com.example.usermanagement.security;

import com.example.usermanagement.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final TypeReference<Map<String, Object>> CLAIMS_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final byte[] secret;
    private final long expirationSeconds;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${application.security.jwt.secret}") String secret,
            @Value("${application.security.jwt.expiration-minutes}") long expirationMinutes) {
        this.objectMapper = objectMapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationMinutes * 60;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Map<String, Object> header = Map.of(
                "alg", "HS256",
                "typ", "JWT");
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", user.getEmail());
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());

        String headerPart = encodeJson(header);
        String claimsPart = encodeJson(claims);
        String signingInput = headerPart + "." + claimsPart;

        return signingInput + "." + sign(signingInput);
    }

    public String extractUsername(String token) {
        try {
            return (String) parseClaims(token).get("sub");
        } catch (RuntimeException exception) {
            return null;
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username != null
                && username.equals(userDetails.getUsername())
                && isSignatureValid(token)
                && !isExpired(token);
    }

    private boolean isSignatureValid(String token) {
        String[] parts = splitToken(token);
        String signingInput = parts[0] + "." + parts[1];
        return sign(signingInput).equals(parts[2]);
    }

    private boolean isExpired(String token) {
        Object expiration = parseClaims(token).get("exp");
        long expirationEpochSecond = ((Number) expiration).longValue();
        return Instant.now().getEpochSecond() >= expirationEpochSecond;
    }

    private Map<String, Object> parseClaims(String token) {
        try {
            String[] parts = splitToken(token);
            byte[] decodedClaims = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(decodedClaims, CLAIMS_TYPE);
        } catch (Exception exception) {
            throw new IllegalArgumentException("Invalid JWT token", exception);
        }
    }

    private String[] splitToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT token");
        }
        return parts;
    }

    private String encodeJson(Map<String, Object> value) {
        try {
            byte[] json = objectMapper.writeValueAsBytes(value);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to encode JWT JSON", exception);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret, HMAC_SHA256));
            byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign JWT token", exception);
        }
    }
}
