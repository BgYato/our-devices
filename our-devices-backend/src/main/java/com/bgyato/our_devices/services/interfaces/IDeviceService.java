package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.dto.device.DevicesUpdateDTO;

import java.util.List;

public interface IDeviceService {

    DevicesResponseDTO saveDevice (DevicesCreateDTO devicesCreateDTO);
    DevicesResponseDTO updateDevice (DevicesUpdateDTO devicesUpdateDTO, String id);
    DevicesResponseDTO getDeviceById (String id);
    List<DevicesResponseDTO> getDevicesByUserId (String id);
    void deleteDevice (String id);
}
