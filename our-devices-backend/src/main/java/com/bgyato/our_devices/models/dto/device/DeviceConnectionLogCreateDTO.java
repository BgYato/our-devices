package com.bgyato.our_devices.models.dto.device;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceConnectionLogCreateDTO {
    @NotBlank
    private String deviceId;
    private String ipAddress;
    private String connectionType;
    private String message;
}
