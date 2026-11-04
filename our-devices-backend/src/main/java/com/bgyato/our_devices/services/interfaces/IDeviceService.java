package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.dto.device.DevicesUpdateDTO;
import com.bgyato.our_devices.models.dto.device.DeviceHeartbeatDTO;

import java.util.List;

public interface IDeviceService {
    DevicesResponseDTO saveDevice (DevicesCreateDTO devicesCreateDTO, String email);
    DevicesResponseDTO updateDevice (DevicesUpdateDTO devicesUpdateDTO, String id, String email);
    DevicesResponseDTO heartbeat (DeviceHeartbeatDTO heartbeat, String id, String email);
    void disconnect (String id, String email);
    DevicesResponseDTO getDeviceById (String id, String email);
    List<DevicesResponseDTO> getDevicesByUserId (String id, String email);
    List<DevicesResponseDTO> getDevicesForCurrentUser (String email);
    void deleteDevice (String id, String email);
}
