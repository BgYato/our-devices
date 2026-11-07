package com.bgyato.our_devices.models.dto.device;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;
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

    @PositiveOrZero
    private Long totalStorageMB;

    @PositiveOrZero
    private Long totalMemoryMB;

    @Size(max = 32)
    private String networkType;

    @Size(max = 128)
    private String wifiSsid;

    @Min(0)
    @Max(100)
    private Integer audioVolumePercent;

    private Boolean audioMuted;

    private Boolean wifiSsidSharingEnabled;

    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private Double latitude;

    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private Double longitude;

    @PositiveOrZero
    private Double locationAccuracyMeters;

    private Boolean locationSharingEnabled;

    @AssertTrue(message = "La latitud y la longitud deben enviarse juntas.")
    public boolean isLocationCoordinatesValid() {
        return (latitude == null) == (longitude == null);
    }
}
