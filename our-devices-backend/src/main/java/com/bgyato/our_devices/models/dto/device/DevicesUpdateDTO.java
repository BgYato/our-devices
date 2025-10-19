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
    private String deviceTypeId;
    private String customName;
    private String type;
    private String ipAddress;
    private Date lastSeen;
    private Integer batteryLevel;
}
