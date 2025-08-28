package com.bgyato.our_devices.models.dto.user;

import lombok.*;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsersResponseDTO {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private boolean isValidated;
    private boolean isDeleted;
    private Date dateCreation;
}
