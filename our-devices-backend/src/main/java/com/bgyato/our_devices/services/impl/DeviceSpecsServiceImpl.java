package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.EntityAlreadyExistsException;
import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.dto.device_specs.DeviceSpecsResponseDTO;
import com.bgyato.our_devices.models.dto.device_specs.DeviceSpecsSaveDTO;
import com.bgyato.our_devices.models.entities.DeviceEntity;
import com.bgyato.our_devices.models.entities.DeviceSpecsEntity;
import com.bgyato.our_devices.repositories.IDeviceRepository;
import com.bgyato.our_devices.repositories.IDeviceSpecsRepository;
import com.bgyato.our_devices.services.interfaces.IDeviceSpecsService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class DeviceSpecsServiceImpl implements IDeviceSpecsService {
    private final IDeviceSpecsRepository deviceSpecsRepository;
    private final IDeviceRepository deviceRepository;
    private ModelMapper modelMapper;

    @Override
    @Transactional
    public DeviceSpecsResponseDTO save(DeviceSpecsSaveDTO specs) {
        DeviceEntity device = deviceRepository.findByIdAndIsDeletedFalse(specs.getDeviceId())
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado al equipo con id " + specs.getDeviceId()));

        if (deviceSpecsRepository.findByDevice_Id(specs.getDeviceId()).isPresent())
            throw new EntityAlreadyExistsException("Ya existen especificaciones para la máquina.");

        DeviceSpecsEntity entity = DeviceSpecsEntity.builder()
                .cpuModel(specs.getCpuModel())
                .cpuCores(specs.getCpuCores())
                .ramSizeMB(specs.getRamSizeMB())
                .gpuModel(specs.getGpuModel())
                .totalStorageMB(specs.getTotalStorageMB())
                .freeStorageMB(specs.getFreeStorageMB())
                .architecture(specs.getArchitecture())
                .screenResolution(specs.getScreenResolution())
                .lastUpdateVersion(specs.getLastUpdateVersion())
                .device(device)
                .build();

        DeviceSpecsEntity saved = deviceSpecsRepository.save(entity);

        return modelMapper.map(saved, DeviceSpecsResponseDTO.class);
    }

    @Override
    public DeviceSpecsResponseDTO findByDeviceId(String deviceId) {
        DeviceSpecsEntity entity = deviceSpecsRepository.findByDevice_Id(deviceId)
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado a la máquina con ID "+deviceId));

        return modelMapper.map(entity, DeviceSpecsResponseDTO.class);
    }
}
