package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.dto.device.DeviceConnectionLogCreateDTO;
import com.bgyato.our_devices.models.dto.device.DeviceConnectionLogResponseDTO;
import com.bgyato.our_devices.models.entities.DeviceConnectionLogEntity;
import com.bgyato.our_devices.models.entities.DeviceEntity;
import com.bgyato.our_devices.repositories.IDeviceConnectionLogRepository;
import com.bgyato.our_devices.repositories.IDeviceRepository;
import com.bgyato.our_devices.services.interfaces.IDeviceConnectionLogService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceConnectionLogServiceImpl implements IDeviceConnectionLogService {

    private final IDeviceConnectionLogRepository repository;
    private final IDeviceRepository deviceRepository;

    @Override
    @Transactional
    public DeviceConnectionLogResponseDTO logConnection(DeviceConnectionLogCreateDTO dto, String email) {
        DeviceEntity device = findOwnedDevice(dto.getDeviceId(), email);
        DeviceConnectionLogEntity log = DeviceConnectionLogEntity.builder()
                .device(device)
                .ipAddress(dto.getIpAddress())
                .connectionType(dto.getConnectionType())
                .message(dto.getMessage())
                .wasSuccessful(true)
                .build();
        return toResponse(repository.save(log));
    }

    @Override
    @Transactional
    public List<DeviceConnectionLogResponseDTO> getLogsByDevice(String deviceId, String email) {
        findOwnedDevice(deviceId, email);
        return repository.findByDevice_IdOrderByConnectionTimeDesc(deviceId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void markDisconnection(String logId, String email) {
        DeviceConnectionLogEntity log = repository.findById(logId)
                .filter(item -> item.getDevice().getUser().getEmail().equalsIgnoreCase(email)
                        && !item.getDevice().isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Registro de conexión no encontrado."));
        log.setDisconnectionTime(new Date());
        repository.save(log);
    }

    private DeviceEntity findOwnedDevice(String deviceId, String email) {
        return deviceRepository.findByIdAndIsDeletedFalse(deviceId)
                .filter(device -> device.getUser().getEmail().equalsIgnoreCase(email))
                .orElseThrow(() -> new EntityNotFoundException("Dispositivo no encontrado."));
    }

    private DeviceConnectionLogResponseDTO toResponse(DeviceConnectionLogEntity log) {
        return new DeviceConnectionLogResponseDTO(
                log.getId(),
                log.getDevice().getId(),
                log.getConnectionTime().toInstant(),
                log.getDisconnectionTime() == null ? null : log.getDisconnectionTime().toInstant(),
                log.getIpAddress(),
                log.isWasSuccessful(),
                log.getConnectionType(),
                log.getMessage());
    }
}
