package com.bgyato.our_devices.models.dto;

import com.bgyato.our_devices.models.dto.user.UsersResponseDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UsersResponseDTO user;
}
