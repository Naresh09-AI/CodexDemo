package com.example.usermanagement.config;

import com.example.usermanagement.entity.User;
import com.example.usermanagement.entity.UserRole;
import com.example.usermanagement.entity.UserStatus;
import com.example.usermanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminUserSeeder implements CommandLineRunner {

    private final AdminUserProperties adminUserProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        adminUserProperties.getUsers().forEach(this::createAdminIfMissing);
    }

    private void createAdminIfMissing(AdminUserProperties.AdminUser adminUser) {
        if (userRepository.existsByEmail(adminUser.getEmail())) {
            return;
        }

        User user = User.builder()
                .firstName(adminUser.getFirstName())
                .lastName(adminUser.getLastName())
                .email(adminUser.getEmail())
                .password(passwordEncoder.encode(adminUser.getPassword()))
                .phone(adminUser.getPhone())
                .status(UserStatus.ACTIVE)
                .role(UserRole.ADMIN)
                .build();

        userRepository.save(user);
    }
}
