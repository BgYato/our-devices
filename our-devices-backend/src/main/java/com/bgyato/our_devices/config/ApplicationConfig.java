package com.bgyato.our_devices.config;

import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final IUserRepository userRepository;

    @Bean
    public AuthenticationManager authenticationManager (AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
        authenticationProvider.setUserDetailsService(userDetailsService());
        authenticationProvider.setPasswordEncoder(passwordEncoder());

        return authenticationProvider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return identifier -> {
            Optional<UserEntity> userOpt;
            if (identifier.contains("@")) {
                userOpt = userRepository.findByEmailAndIsDeletedFalse(identifier);
            } else {
                userOpt = userRepository.findByUsernameAndIsDeletedFalse(identifier);
            }

            UserEntity user = userOpt.orElseThrow(
                    () -> new EntityNotFoundException("Usuario no encontrado con: " + identifier)
            );

            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail()) // Ojo: aquí Spring necesita un username único, pero puede seguir siendo el email
                    .password(user.getPassword())
                    .roles("USER")
                    .build();
        };
    }


}
