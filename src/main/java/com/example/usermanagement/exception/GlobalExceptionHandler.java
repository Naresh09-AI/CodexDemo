package com.example.usermanagement.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request, null);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateResource(
            DuplicateResourceException exception,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.CONFLICT, exception.getMessage(), request, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        Map<String, String> validationErrors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> validationErrors.put(error.getField(), error.getDefaultMessage()));

        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Request validation failed",
                request,
                validationErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {
        String message = resolveUnreadableMessage(exception);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message, request, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(
            BadCredentialsException exception,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Invalid email or password", request, null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(
            AccessDeniedException exception,
            HttpServletRequest request) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Access is denied", request, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request) {
        return buildErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request,
                null);
    }

    private ResponseEntity<ApiErrorResponse> buildErrorResponse(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            Map<String, String> validationErrors) {
        ApiErrorResponse response = ApiErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(status).body(response);
    }

    private String resolveUnreadableMessage(HttpMessageNotReadableException exception) {
        if (exception.getCause() instanceof InvalidFormatException invalidFormatException
                && invalidFormatException.getTargetType().isEnum()) {
            return "Invalid value provided for field: "
                    + invalidFormatException.getPath().getLast().getFieldName();
        }

        return "Malformed JSON request";
    }
}
