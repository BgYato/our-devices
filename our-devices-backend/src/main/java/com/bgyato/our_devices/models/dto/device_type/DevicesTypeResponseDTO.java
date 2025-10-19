package com.bgyato.our_devices.models.dto.device_type;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevicesTypeResponseDTO {
    private String id;
    private String name;
    private String description;
    private Date createdAt;
    private Date updatedAt;
}
