package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.EntityAlreadyExistsException;
import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.dto.device.DevicesUpdateDTO;
import com.bgyato.our_devices.models.entities.DeviceEntity;
import com.bgyato.our_devices.models.entities.DeviceTypeEntity;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repositories.IDeviceRepository;
import com.bgyato.our_devices.repositories.IDeviceTypeRepository;
import com.bgyato.our_devices.repositories.IUserRepository;
import com.bgyato.our_devices.services.interfaces.IDeviceService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@AllArgsConstructor
public class DeviceServiceImpl implements IDeviceService {

    private final IDeviceRepository deviceRepository;
    private final IUserRepository userRepository;
    private final IDeviceTypeRepository deviceTypeRepository;

    @Override
    public DevicesResponseDTO saveDevice(DevicesCreateDTO dto) {
        UserEntity user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + dto.getUserId()));

        DeviceTypeEntity deviceType = deviceTypeRepository.findById(dto.getDeviceTypeId())
                .orElseThrow(() -> new EntityNotFoundException("Tipo de dispositivo no encontrado con ID: " + dto.getDeviceTypeId()));

        deviceRepository.findByUser_IdAndNameIgnoreCase(user.getId(), dto.getName())
                .ifPresent(d -> { throw new EntityAlreadyExistsException("Ya existe un dispositivo con ese nombre para este usuario."); });

        if (dto.getIpAddress() != null) {
            deviceRepository.findByIpAddress(dto.getIpAddress())
                    .ifPresent(d -> { throw new EntityAlreadyExistsException("Ya existe un dispositivo registrado con esa dirección IP."); });
        }

        DeviceEntity device = DeviceEntity.builder()
                .user(user)
                .deviceType(deviceType)
                .name(dto.getName())
                .customName(dto.getCustomName())
                .ipAddress(dto.getIpAddress())
                .isDeleted(false)
                .dateCreation(new Date())
                .build();

        device = deviceRepository.save(device);
        return mapToResponse(device);
    }

    @Override
    public DevicesResponseDTO updateDevice(DevicesUpdateDTO dto, String id) {
        DeviceEntity device = deviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Dispositivo no encontrado con ID: " + id));

        if (dto.getName() != null && !dto.getName().equalsIgnoreCase(device.getName())) {
            deviceRepository.findByUser_IdAndNameIgnoreCase(device.getUser().getId(), dto.getName())
                    .ifPresent(d -> { throw new EntityAlreadyExistsException("Ya existe otro dispositivo con ese nombre."); });
            device.setName(dto.getName());
        }

        if (dto.getCustomName() != null) device.setCustomName(dto.getCustomName());
        if (dto.getIpAddress() != null) device.setIpAddress(dto.getIpAddress());
        if (dto.getBatteryLevel() != null) device.setBatteryLevel(dto.getBatteryLevel());
        if (dto.getLastSeen() != null) device.setLastSeen(dto.getLastSeen());

        if (dto.getDeviceTypeId() != null) {
            DeviceTypeEntity type = deviceTypeRepository.findById(dto.getDeviceTypeId())
                    .orElseThrow(() -> new EntityNotFoundException("Tipo de dispositivo no encontrado con ID: " + dto.getDeviceTypeId()));
            device.setDeviceType(type);
        }

        device = deviceRepository.save(device);
        return mapToResponse(device);
    }

    @Override
    public DevicesResponseDTO getDeviceById(String id) {
        DeviceEntity device = deviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Dispositivo no encontrado con ID: " + id));
        return mapToResponse(device);
    }

    @Override
    public List<DevicesResponseDTO> getDevicesByUserId(String userId) {
        return deviceRepository.findByUserIdAndIsDeletedFalse(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteDevice(String id) {
        DeviceEntity device = deviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Dispositivo no encontrado con ID: " + id));
        device.setDeleted(true);
        deviceRepository.save(device);
    }

    private DevicesResponseDTO mapToResponse(DeviceEntity device) {
        String status = "offline";
        if (device.getLastSeen() != null) {
            long diff = new Date().getTime() - device.getLastSeen().getTime();
            if (diff < 2 * 60 * 1000) status = "online";
        }

        return new DevicesResponseDTO(
                device.getId(),
                device.getUser().getId(),
                device.getName(),
                device.getCustomName(),
                device.getDeviceType() != null ? device.getDeviceType().getName() : "Desconocido",
                device.getIpAddress(),
                device.getBatteryLevel(),
                device.getLastSeen(),
                status
        );
    }
}
