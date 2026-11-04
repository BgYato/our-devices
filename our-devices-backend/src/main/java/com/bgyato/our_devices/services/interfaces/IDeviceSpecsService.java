package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.dto.device_specs.DeviceSpecsResponseDTO;
import com.bgyato.our_devices.models.dto.device_specs.DeviceSpecsSaveDTO;

import java.util.Optional;

public interface IDeviceSpecsService {
    DeviceSpecsResponseDTO save(DeviceSpecsSaveDTO specs, String email);
    DeviceSpecsResponseDTO findByDeviceId(String deviceId, String email);
}
