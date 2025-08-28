package com.bgyato.our_devices.service.impl;

import com.bgyato.our_devices.models.dto.AuthRequest;
import com.bgyato.our_devices.models.dto.AuthResponse;
import com.bgyato.our_devices.repository.IUserRepository;
import com.bgyato.our_devices.service.interfaces.IAuthService;
import com.bgyato.our_devices.service.interfaces.IUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
//        try {
//            UserEntity user = userRepository.findByEmailAndIsDeletedFalse(loginRequest.getEmail())
//                    .orElseThrow(() -> new EntityNotFoundException(String.format("El usuario con correo '%s' no fue encontrado.", loginRequest.getEmail())));
//
//            if (!user.isValidated()) {
//                throw new UserIsNotValidatedException("El correo no ha sido validado correctamente.");
//            }
//
//            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
//        } catch (AuthenticationException ex) {
//            throw new BadCredentialsException("Credenciales incorrectas");
//        }
//
//        UserEntity userEntity = userRepository.findByEmail(loginRequest.getEmail()).orElseThrow();
//
//        UserDetails user = userRepository.findByEmail(loginRequest.getEmail())
//                .map(u -> org.springframework.security.core.userdetails.User.builder()
//                        .username(u.getEmail())
//                        .password(u.getPassword())
//                        .roles("USER")
//                        .build())
//                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
//
//        Map<String, Object> extraClaims = new HashMap<>();
//        extraClaims.put("id", userEntity.getId());
//        extraClaims.put("fullName", (userEntity.getFirstName() + " " + userEntity.getLastName()));
//        extraClaims.put("email", userEntity.getEmail());
//
//        String token = jwtServiceImpl.getToken(extraClaims, user);
//        return AuthResponse.builder()
//                .token(token)
//                .build();
        return null;
    }

}
