package com.bgyato.our_devices.models.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsersCreateDTO {
    @NotBlank(message = "El nombre es obligatorio.")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres.")
    private String firstName;
    @NotBlank(message = "El apellido es obligatorio.")
    @Size(max = 80, message = "El apellido no puede superar 80 caracteres.")
    private String lastName;
    @NotBlank(message = "El correo electrónico es obligatorio.")
    @Email(message = "Ingresa un correo electrónico válido.")
    @Size(max = 254, message = "El correo electrónico es demasiado largo.")
    private String email;
    @NotBlank(message = "El nombre de usuario es obligatorio.")
    @Size(min = 3, max = 30, message = "El nombre de usuario debe tener entre 3 y 30 caracteres.")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El usuario solo puede incluir letras, números, punto, guion y guion bajo.")
    private String username;
    @NotBlank(message = "La contraseña es obligatoria.")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres.")
    private String password;
}
