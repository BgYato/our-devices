package com.bgyato.our_devices.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.Date;

@Entity
@Table(name = "device_types_entity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceTypeEntity {

    @Id
    @UuidGenerator
    private String id;

    @Column(nullable = false, unique = true)
    private String name; // Ej: "Laptop", "Desktop", "Smartphone", etc.

    @Column
    private String description;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at")
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;

    @Column(name = "is_deleted",columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
    }
}
