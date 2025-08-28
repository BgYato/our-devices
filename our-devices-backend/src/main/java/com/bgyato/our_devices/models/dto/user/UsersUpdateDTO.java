package com.bgyato.our_devices.models.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsersUpdateDTO {
    private String firstName;
    private String lastName;
    private String email;
    private Boolean isValidated;
    private Boolean isDeleted;
}
