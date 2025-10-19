package com.bgyato.our_devices.models.dto.device_type;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTypeSaveDTO {
    private String name;
    private String description;
}
