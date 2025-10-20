package com.bgyato.our_devices.models.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevicesResponseDTO {
    private String id;
    private String userId;
    private String userName;
    private String deviceTypeName;
    private String name;
    private String customName;
    private String hostname;
    private String osName;
    private String osVersion;
    private String ipAddress;
    private String macAddress;
    private Integer batteryLevel;
    private Boolean isOnline;
    private String lastSeen;
    private String status;
}
