package com.example.usermanagement.service;

import com.example.usermanagement.dto.AuthResponse;
import com.example.usermanagement.dto.LoginRequest;
import com.example.usermanagement.dto.RegisterRequest;
import com.example.usermanagement.dto.UserResponse;

public interface AuthService {

    UserResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser();
}
