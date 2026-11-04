package com.bgyato.our_devices.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.Date;

@Entity
@Table(name = "devices_entity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceEntity {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // 🔹 Relación con tipo de dispositivo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_type_id")
    private DeviceTypeEntity deviceType;

    // 🔹 Información básica
    @Column(nullable = false)
    private String name; // Nombre visible del dispositivo

    @Column(name = "custom_name")
    private String customName; // Alias o nombre personalizado

    @Column(name = "hostname")
    private String hostname; // Nombre de la máquina local

    @Column(name = "os_name")
    private String osName; // Ej: Windows 11, Ubuntu 24.04, macOS Sonoma

    @Column(name = "os_version")
    private String osVersion;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "mac_address")
    private String macAddress;

    // 🔹 Seguridad y autenticación
    @Column(name = "has_password", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean hasPassword;

    @Column(name = "device_password")
    private String devicePassword;

    // 🔹 Estado y métricas
    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(name = "is_online", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isOnline;

    @Column(name = "is_deleted", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isDeleted = false;

    @Temporal(TemporalType.TIMESTAMP)
    private Date lastSeen;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateCreation;

    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt;

    @OneToOne(mappedBy = "device", fetch = FetchType.LAZY, optional = true, cascade = CascadeType.ALL, orphanRemoval = true)
    private DeviceSpecsEntity specs;

    @OneToOne(mappedBy = "device", fetch = FetchType.LAZY, optional = true, cascade = CascadeType.ALL, orphanRemoval = true)
    private DeviceTelemetryEntity telemetry;

    @PrePersist
    protected void onCreate() {
        dateCreation = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}
