package com.bgyato.our_devices.repositories;

import com.bgyato.our_devices.models.entities.DeviceConnectionLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IDeviceConnectionLogRepository extends JpaRepository<DeviceConnectionLogEntity, String> {
    List<DeviceConnectionLogEntity> findByDevice_IdOrderByConnectionTimeDesc(String deviceId);
}
