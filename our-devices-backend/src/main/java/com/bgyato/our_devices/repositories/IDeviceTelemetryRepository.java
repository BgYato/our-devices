package com.bgyato.our_devices.repositories;

import com.bgyato.our_devices.models.entities.DeviceTelemetryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IDeviceTelemetryRepository extends JpaRepository<DeviceTelemetryEntity, String> {
    Optional<DeviceTelemetryEntity> findByDevice_Id(String deviceId);
}
