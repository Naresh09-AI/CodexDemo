package com.example.usermanagement.config;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "application.admin")
public class AdminUserProperties {

    private List<AdminUser> users = new ArrayList<>();

    @Getter
    @Setter
    public static class AdminUser {

        private String firstName;
        private String lastName;
        private String email;
        private String password;
        private String phone;
    }
}
