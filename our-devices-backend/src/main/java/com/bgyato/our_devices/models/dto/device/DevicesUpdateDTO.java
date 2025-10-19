package com.bgyato.our_devices.models.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DevicesUpdateDTO {
    private String name;
    private String customName;
    private String deviceTypeId;
    private String ipAddress;
    private Integer batteryLevel;
    private Boolean isOnline;
    private Date lastSeen;
}
