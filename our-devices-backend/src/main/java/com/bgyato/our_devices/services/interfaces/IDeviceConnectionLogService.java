package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.dto.device.DeviceConnectionLogCreateDTO;
import com.bgyato.our_devices.models.dto.device.DeviceConnectionLogResponseDTO;

import java.util.List;

public interface IDeviceConnectionLogService {
    DeviceConnectionLogResponseDTO logConnection(DeviceConnectionLogCreateDTO log, String email);
    List<DeviceConnectionLogResponseDTO> getLogsByDevice(String deviceId, String email);
    void markDisconnection(String logId, String email);
}
