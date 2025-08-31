package com.bgyato.our_devices.service.impl;

import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.dto.device.DevicesUpdateDTO;
import com.bgyato.our_devices.models.entities.DeviceEntity;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repository.IDeviceRepository;
import com.bgyato.our_devices.repository.IUserRepository;
import com.bgyato.our_devices.service.interfaces.IDeviceService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@AllArgsConstructor
public class DeviceServiceImpl implements IDeviceService {

    private final IDeviceRepository deviceRepository;
    private final IUserRepository userRepository;

    @Override
    public DevicesResponseDTO saveDevice(DevicesCreateDTO dto) {
        UserEntity user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        DeviceEntity device = DeviceEntity.builder()
                .user(user)
                .name(dto.getName())
                .type(dto.getType())
                .ipAddress(dto.getIpAddress())
                .isDeleted(false)
                .build();

        device = deviceRepository.save(device);

        return mapToResponse(device);
    }

    @Override
    public DevicesResponseDTO updateDevice(DevicesUpdateDTO dto, String id) {
        DeviceEntity device = deviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado"));

        device.setName(dto.getName());
        device.setType(dto.getType());
        device.setIpAddress(dto.getIpAddress());
        device.setBatteryLevel(dto.getBatteryLevel());
        device.setLastSeen(dto.getLastSeen() != null ? dto.getLastSeen() : new Date());

        device = deviceRepository.save(device);

        return mapToResponse(device);
    }

    @Override
    public DevicesResponseDTO getDeviceById(String id) {
        DeviceEntity device = deviceRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado"));
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
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado"));
        device.setDeleted(true);
        deviceRepository.save(device);
    }

    private DevicesResponseDTO mapToResponse(DeviceEntity device) {
        String status = "offline";

        if (device.getLastSeen() != null) {
            long diff = new Date().getTime() - device.getLastSeen().getTime();
            if (diff < 2 * 60 * 1000) {
                status = "online";
            }
        }

        return new DevicesResponseDTO(
                device.getId(),
                device.getUser().getId(),
                device.getName(),
                device.getType(),
                device.getIpAddress(),
                device.getBatteryLevel(),
                device.getLastSeen(),
                status
        );
    }

}
