package com.bgyato.our_devices.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "device_specs_entity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceSpecsEntity {

    @Id
    @UuidGenerator
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private DeviceEntity device;

    private String cpuModel;
    private Integer cpuCores;
    private Integer ramSizeMB;
    private String gpuModel;
    private Long totalStorageMB;
    private Long freeStorageMB;

    @Column(name = "architecture")
    private String architecture; // Ej: x86_64, ARM64

    @Column(name = "screen_resolution")
    private String screenResolution; // Ej: 1920x1080

    @Column(name = "last_update_version")
    private String lastUpdateVersion; // versión del agente cliente

}
