package com.bgyato.our_devices.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;

@Entity
@Table(name = "device_telemetry_entity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceTelemetryEntity {

    @Id
    @UuidGenerator
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false, unique = true)
    private DeviceEntity device;

    private Integer batteryLevel;
    private Double cpuUsagePercent;
    private Double memoryUsagePercent;
    private Long freeStorageMB;
    private Long totalStorageMB;
    private Long totalMemoryMB;
    @Column(length = 32)
    private String networkType;
    @Column(length = 128)
    private String wifiSsid;
    private Integer audioVolumePercent;
    private Boolean audioMuted;
    private Boolean wifiSsidSharingEnabled;
    private Double latitude;
    private Double longitude;
    private Double locationAccuracyMeters;
    private Instant locationCapturedAt;
    private Boolean locationSharingEnabled;
    private Instant capturedAt;
}
