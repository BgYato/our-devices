package com.bgyato.our_devices.repositories;

import com.bgyato.our_devices.models.entities.DeviceSpecsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IDeviceSpecsRepository extends JpaRepository<DeviceSpecsEntity, String> {
    DeviceSpecsEntity findByDevice_Id(String deviceId);
}
