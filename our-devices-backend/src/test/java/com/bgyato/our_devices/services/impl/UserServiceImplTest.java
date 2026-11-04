package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.models.dto.user.UsersCreateDTO;
import com.bgyato.our_devices.models.dto.user.UsersResponseDTO;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repositories.IUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.modelmapper.ModelMapper;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private IUserRepository userRepository;
    @Mock
    private ModelMapper modelMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtServiceImpl jwtService;

    @InjectMocks
    private UserServiceImpl service;

    @Test
    void createsAccountWithNormalizedIdentifiersAndEncodedPassword() {
        UsersCreateDTO input = new UsersCreateDTO(
                "  Jane ", " Doe  ", " JANE@EXAMPLE.COM ", " Jane.Doe ", "password123");
        UserEntity mapped = UserEntity.builder().password("password123").build();
        UsersResponseDTO response = new UsersResponseDTO();

        when(userRepository.existsByEmailOrUsernameAndIsDeletedFalse(
                "jane@example.com", "jane.doe")).thenReturn(false);
        when(modelMapper.map(input, UserEntity.class)).thenReturn(mapped);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(modelMapper.map(mapped, UsersResponseDTO.class)).thenReturn(response);

        UsersResponseDTO result = service.saveUser(input);

        assertEquals(response, result);
        assertEquals("Jane", mapped.getFirstName());
        assertEquals("Doe", mapped.getLastName());
        assertEquals("jane@example.com", mapped.getEmail());
        assertEquals("jane.doe", mapped.getUsername());
        assertEquals("encoded-password", mapped.getPassword());
        verify(userRepository).save(mapped);
    }
}
