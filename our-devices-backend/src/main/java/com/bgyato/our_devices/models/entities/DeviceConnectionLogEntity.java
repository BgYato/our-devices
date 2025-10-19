package com.bgyato.our_devices.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.Date;

@Entity
@Table(name = "device_connection_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceConnectionLogEntity {

    @Id
    @UuidGenerator
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private DeviceEntity device;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "connection_time", nullable = false)
    private Date connectionTime;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "disconnection_time")
    private Date disconnectionTime;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "was_successful", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean wasSuccessful = true;

    @Column(name = "connection_type")
    private String connectionType; // Ej: "WiFi", "Ethernet", "Bluetooth", etc.

    @Column(name = "message")
    private String message; // Info adicional: "Timeout", "Conexión establecida", etc.

    @PrePersist
    protected void onConnect() {
        connectionTime = new Date();
    }
}
