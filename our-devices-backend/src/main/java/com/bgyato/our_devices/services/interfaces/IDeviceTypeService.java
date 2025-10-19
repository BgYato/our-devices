package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.dto.device_type.DeviceTypeResponseDTO;
import com.bgyato.our_devices.models.dto.device_type.DeviceTypeSaveDTO;

import java.util.List;

public interface IDeviceTypeService {
    DeviceTypeResponseDTO create(DeviceTypeSaveDTO type);
    List<DeviceTypeResponseDTO> getAll();
    DeviceTypeResponseDTO findById(String id);
    DeviceTypeResponseDTO findByName(String name);
    DeviceTypeResponseDTO update(String id, DeviceTypeSaveDTO type);
    void delete(String id);
}
