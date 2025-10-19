package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.BadCredentialsException;
import com.bgyato.our_devices.models.dto.AuthRequest;
import com.bgyato.our_devices.models.dto.AuthResponse;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repositories.IUserRepository;
import com.bgyato.our_devices.services.interfaces.IAuthService;
import com.bgyato.our_devices.services.interfaces.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    private final AuthenticationManager authenticationManager;
    private final IUserService userService;
    private final JwtServiceImpl jwtServiceImpl;
    private final IUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    @Override
    public AuthResponse login(AuthRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getIdentifier(),
                            loginRequest.getPassword()
                    )
            );
        } catch (AuthenticationException ex) {
            throw new BadCredentialsException("Error al iniciar sesión: " + (ex.getMessage().equals("Bad credentials") ? "Contraseña incorrecta" : ex.getMessage()));
        }

        UserEntity userEntity = loginRequest.getIdentifier().contains("@")
                ? userRepository.findByEmailAndIsDeletedFalse(loginRequest.getIdentifier()).orElseThrow()
                : userRepository.findByUsernameAndIsDeletedFalse(loginRequest.getIdentifier()).orElseThrow();

        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("id", userEntity.getId());
        extraClaims.put("fullName", userEntity.getFirstName() + " " + userEntity.getLastName());
        extraClaims.put("email", userEntity.getEmail());
        extraClaims.put("username", userEntity.getUsername());

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(userEntity.getEmail()) // se usa como principal
                .password(userEntity.getPassword())
                .roles("USER")
                .build();

        String token = jwtServiceImpl.getToken(extraClaims, userDetails);

        return AuthResponse.builder()
                .token(token)
                .build();
    }

}
