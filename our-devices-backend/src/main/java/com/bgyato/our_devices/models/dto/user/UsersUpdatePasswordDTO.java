package com.bgyato.our_devices.models.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsersUpdatePasswordDTO {
    private String lastPassword;
    private String newPassword;
}
