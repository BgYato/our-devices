package com.bgyato.our_devices.models.dto.device;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTelemetryResponseDTO {
    private Integer batteryLevel;
    private Double cpuUsagePercent;
    private Double memoryUsagePercent;
    private Long freeStorageMB;
    private Long totalStorageMB;
    private Long totalMemoryMB;
    private Double latitude;
    private Double longitude;
    private Double locationAccuracyMeters;
    private Instant locationCapturedAt;
    private Boolean locationSharingEnabled;
    private Instant capturedAt;
}
