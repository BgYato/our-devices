package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.entities.DeviceSpecsEntity;

import java.util.Optional;

public interface IDeviceSpecsService {
    DeviceSpecsEntity save(DeviceSpecsEntity specs);
    Optional<DeviceSpecsEntity> findByDeviceId(String deviceId);
    void deleteByDeviceId(String deviceId);
}
