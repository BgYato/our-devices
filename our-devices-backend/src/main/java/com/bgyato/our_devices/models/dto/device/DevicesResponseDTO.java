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
    private String deviceTypeName;
    private String name;
    private String type;
    private String ipAddress;
    private Integer batteryLevel;
    private Date lastSeen;
    private String status;
}
