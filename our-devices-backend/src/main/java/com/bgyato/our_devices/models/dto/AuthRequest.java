package com.bgyato.our_devices.models.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    @NotBlank(message = "El correo o nombre de usuario es obligatorio.")
    private String identifier;
    @NotBlank(message = "La contraseña es obligatoria.")
    private String password;
}
