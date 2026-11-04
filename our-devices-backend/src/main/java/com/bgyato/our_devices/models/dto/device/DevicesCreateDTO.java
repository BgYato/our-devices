package com.bgyato.our_devices.models.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevicesCreateDTO {
    private String deviceTypeId;
    private String deviceTypeName;
    private String name;
    private String customName;
    private String hostname;
    private String osName;
    private String osVersion;
    private String ipAddress;
    private String macAddress;
}
