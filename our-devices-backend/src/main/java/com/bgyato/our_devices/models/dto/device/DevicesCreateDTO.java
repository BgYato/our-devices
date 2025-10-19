package com.bgyato.our_devices.models.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevicesCreateDTO {
    private String userId;
    private String deviceTypeId;
    private String name;
    private String customName;
    private String hostname;
    private String osName;
    private String osVersion;
    private String ipAddress;
    private String macAddress;
}
