package com.bgyato.our_devices.models.dto.device;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceHeartbeatDTO {
    private String ipAddress;

    @Min(0)
    @Max(100)
    private Integer batteryLevel;

    @Min(0)
    @Max(100)
    private Double cpuUsagePercent;

    @Min(0)
    @Max(100)
    private Double memoryUsagePercent;

    @PositiveOrZero
    private Long freeStorageMB;
}
