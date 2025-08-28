package com.bgyato.our_devices.models.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiErrorDTO {
    private String code;
    private String message;
}
