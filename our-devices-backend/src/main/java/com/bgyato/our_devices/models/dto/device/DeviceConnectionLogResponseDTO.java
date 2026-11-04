package com.bgyato.our_devices.models.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceConnectionLogResponseDTO {
    private String id;
    private String deviceId;
    private Instant connectionTime;
    private Instant disconnectionTime;
    private String ipAddress;
    private boolean wasSuccessful;
    private String connectionType;
    private String message;
}
