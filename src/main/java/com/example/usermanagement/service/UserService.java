package com.example.usermanagement.service;

import com.example.usermanagement.dto.UserCreateRequest;
import com.example.usermanagement.dto.UserResponse;
import com.example.usermanagement.dto.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse createUser(UserCreateRequest request);

    UserResponse getUserById(Long id);

    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse updateUser(Long id, UserUpdateRequest request);

    void deleteUser(Long id);
}
