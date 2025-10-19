package com.bgyato.our_devices.services.interfaces;

import com.bgyato.our_devices.models.dto.device_type.DevicesTypeResponseDTO;
import com.bgyato.our_devices.models.dto.device_type.DevicesTypeSaveDTO;

import java.util.List;

public interface IDeviceTypeService {
    DevicesTypeResponseDTO create(DevicesTypeSaveDTO type);
    List<DevicesTypeResponseDTO> getAll();
    DevicesTypeResponseDTO findById(String id);
    DevicesTypeResponseDTO findByName(String name);
    DevicesTypeResponseDTO update(String id, DevicesTypeSaveDTO type);
    void delete(String id);
}
