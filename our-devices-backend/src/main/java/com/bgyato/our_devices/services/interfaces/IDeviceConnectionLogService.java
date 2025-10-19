package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.entities.DeviceConnectionLogEntity;

import java.util.List;

public interface IDeviceConnectionLogService {
    DeviceConnectionLogEntity logConnection(DeviceConnectionLogEntity log);
    List<DeviceConnectionLogEntity> getLogsByDevice(String deviceId);
    void markDisconnection(String logId);
}
