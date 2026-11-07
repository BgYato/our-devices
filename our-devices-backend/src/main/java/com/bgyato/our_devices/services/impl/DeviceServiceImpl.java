package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.EntityAlreadyExistsException;
import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.dto.device.*;
import com.bgyato.our_devices.models.entities.*;
import com.bgyato.our_devices.repositories.*;
import com.bgyato.our_devices.services.interfaces.IDeviceService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@AllArgsConstructor
public class DeviceServiceImpl implements IDeviceService {

    private static final Duration ONLINE_WINDOW = Duration.ofSeconds(90);
    private static final Set<String> DEVICE_TYPE_NAMES = Set.of("Escritorio", "Laptop", "Móvil");

    private final IDeviceRepository deviceRepository;
    private final IUserRepository userRepository;
    private final IDeviceTypeRepository deviceTypeRepository;
    private final IDeviceTelemetryRepository telemetryRepository;

    @Override
    @Transactional
    public DevicesResponseDTO saveDevice(DevicesCreateDTO dto, String email) {
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario autenticado no encontrado."));

        deviceRepository.findByUser_IdAndNameIgnoreCaseAndIsDeletedFalse(user.getId(), dto.getName())
                .ifPresent(device -> {
                    throw new EntityAlreadyExistsException("Ya existe un dispositivo con ese nombre para este usuario.");
                });

        DeviceTypeEntity deviceType = resolveDeviceType(dto.getDeviceTypeId(), dto.getDeviceTypeName());

        DeviceEntity device = DeviceEntity.builder()
                .user(user)
                .deviceType(deviceType)
                .name(dto.getName())
                .customName(dto.getCustomName())
                .hostname(dto.getHostname())
                .osName(dto.getOsName())
                .osVersion(dto.getOsVersion())
                .ipAddress(dto.getIpAddress())
                .macAddress(dto.getMacAddress())
                .isOnline(false)
                .isDeleted(false)
                .dateCreation(new Date())
                .build();

        return mapToResponse(deviceRepository.save(device));
    }

    @Override
    @Transactional
    public DevicesResponseDTO updateDevice(DevicesUpdateDTO dto, String id, String email) {
        DeviceEntity device = findOwnedDevice(id, email);

        if (dto.getName() != null && !dto.getName().equalsIgnoreCase(device.getName())) {
            deviceRepository.findByUser_IdAndNameIgnoreCaseAndIsDeletedFalse(device.getUser().getId(), dto.getName())
                    .ifPresent(existing -> {
                        throw new EntityAlreadyExistsException("Ya existe otro dispositivo con ese nombre.");
                    });
            device.setName(dto.getName());
        }

        if (dto.getCustomName() != null) {
            device.setCustomName(dto.getCustomName());
        }

        if (dto.getDeviceTypeId() != null || dto.getDeviceTypeName() != null) {
            device.setDeviceType(resolveDeviceType(dto.getDeviceTypeId(), dto.getDeviceTypeName()));
        }

        return mapToResponse(deviceRepository.save(device));
    }

    @Override
    @Transactional
    public DevicesResponseDTO heartbeat(DeviceHeartbeatDTO heartbeat, String id, String email) {
        DeviceEntity device = findOwnedDevice(id, email);
        Instant now = Instant.now();

        device.setLastSeen(Date.from(now));
        device.setOnline(true);
        if (heartbeat.getIpAddress() != null && !heartbeat.getIpAddress().isBlank()) {
            device.setIpAddress(heartbeat.getIpAddress());
        }
        device.setBatteryLevel(heartbeat.getBatteryLevel());

        DeviceTelemetryEntity telemetry = telemetryRepository.findByDevice_Id(id)
                .orElseGet(() -> DeviceTelemetryEntity.builder().device(device).build());
        telemetry.setBatteryLevel(heartbeat.getBatteryLevel());
        telemetry.setCpuUsagePercent(heartbeat.getCpuUsagePercent());
        telemetry.setMemoryUsagePercent(heartbeat.getMemoryUsagePercent());
        telemetry.setFreeStorageMB(heartbeat.getFreeStorageMB());
        telemetry.setTotalStorageMB(heartbeat.getTotalStorageMB());
        telemetry.setTotalMemoryMB(heartbeat.getTotalMemoryMB());
        telemetry.setNetworkType(heartbeat.getNetworkType());
        telemetry.setAudioVolumePercent(heartbeat.getAudioVolumePercent());
        telemetry.setAudioMuted(heartbeat.getAudioMuted());
        if (heartbeat.getWifiSsidSharingEnabled() != null) {
            telemetry.setWifiSsidSharingEnabled(heartbeat.getWifiSsidSharingEnabled());
            telemetry.setWifiSsid(
                    heartbeat.getWifiSsidSharingEnabled() ? heartbeat.getWifiSsid() : null);
        }
        if (heartbeat.getLocationSharingEnabled() != null) {
            telemetry.setLocationSharingEnabled(heartbeat.getLocationSharingEnabled());
            if (!heartbeat.getLocationSharingEnabled()) {
                telemetry.setLatitude(null);
                telemetry.setLongitude(null);
                telemetry.setLocationAccuracyMeters(null);
                telemetry.setLocationCapturedAt(null);
            } else if (heartbeat.getLatitude() != null && heartbeat.getLongitude() != null) {
                telemetry.setLatitude(heartbeat.getLatitude());
                telemetry.setLongitude(heartbeat.getLongitude());
                telemetry.setLocationAccuracyMeters(heartbeat.getLocationAccuracyMeters());
                telemetry.setLocationCapturedAt(now);
            }
        }
        telemetry.setCapturedAt(now);
        device.setTelemetry(telemetry);
        telemetryRepository.save(telemetry);

        return mapToResponse(deviceRepository.save(device));
    }

    @Override
    @Transactional
    public void disconnect(String id, String email) {
        DeviceEntity device = findOwnedDevice(id, email);
        device.setOnline(false);
        deviceRepository.save(device);
    }

    @Override
    @Transactional
    public DevicesResponseDTO getDeviceById(String id, String email) {
        return mapToResponse(findOwnedDevice(id, email));
    }

    @Override
    @Transactional
    public List<DevicesResponseDTO> getDevicesByUserId(String userId, String email) {
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(email)
                .filter(account -> account.getId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el recurso solicitado."));
        return mapDevices(deviceRepository.findByUserIdAndIsDeletedFalse(user.getId()));
    }

    @Override
    @Transactional
    public List<DevicesResponseDTO> getDevicesForCurrentUser(String email) {
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario autenticado no encontrado."));
        return mapDevices(deviceRepository.findByUserIdAndIsDeletedFalse(user.getId()));
    }

    @Override
    @Transactional
    public void deleteDevice(String id, String email) {
        DeviceEntity device = findOwnedDevice(id, email);
        device.setDeleted(true);
        device.setOnline(false);
        deviceRepository.save(device);
    }

    private DeviceEntity findOwnedDevice(String id, String email) {
        return deviceRepository.findByIdAndIsDeletedFalse(id)
                .filter(device -> device.getUser().getEmail().equalsIgnoreCase(email))
                .orElseThrow(() -> new EntityNotFoundException("Dispositivo no encontrado."));
    }

    private List<DevicesResponseDTO> mapDevices(List<DeviceEntity> devices) {
        return devices.stream().map(this::mapToResponse).toList();
    }

    private DeviceTypeEntity resolveDeviceType(String typeId, String typeName) {
        if (typeId != null && !typeId.isBlank()) {
            return deviceTypeRepository.findByIdAndIsDeletedFalse(typeId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Tipo de dispositivo no encontrado con ID: " + typeId));
        }
        if (typeName == null || typeName.isBlank()) {
            return null;
        }

        String normalizedName = DEVICE_TYPE_NAMES.stream()
                .filter(name -> name.equalsIgnoreCase(typeName.trim()))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tipo inválido. Usa Escritorio, Laptop o Móvil."));

        return deviceTypeRepository.findByNameIgnoreCaseAndIsDeletedFalse(normalizedName)
                .orElseGet(() -> deviceTypeRepository.save(DeviceTypeEntity.builder()
                        .name(normalizedName)
                        .description("Tipo de dispositivo")
                        .isDeleted(false)
                        .build()));
    }

    private String getDeviceTypeName(DeviceEntity device) {
        if (device.getDeviceType() != null) {
            return device.getDeviceType().getName();
        }
        String osName = device.getOsName() == null ? "" : device.getOsName().toLowerCase(Locale.ROOT);
        if (osName.contains("android") || osName.contains("ios")) {
            return "Móvil";
        }
        if (device.getBatteryLevel() != null
                || (device.getTelemetry() != null && device.getTelemetry().getBatteryLevel() != null)) {
            return "Laptop";
        }
        return "Escritorio";
    }

    private DevicesResponseDTO mapToResponse(DeviceEntity device) {
        Instant lastSeen = device.getLastSeen() == null ? null : device.getLastSeen().toInstant();
        boolean online = device.isOnline()
                && lastSeen != null
                && !lastSeen.isBefore(Instant.now().minus(ONLINE_WINDOW));

        DeviceTelemetryResponseDTO telemetry = device.getTelemetry() == null
                ? null
                : new DeviceTelemetryResponseDTO(
                        device.getTelemetry().getBatteryLevel(),
                        device.getTelemetry().getCpuUsagePercent(),
                        device.getTelemetry().getMemoryUsagePercent(),
                        device.getTelemetry().getFreeStorageMB(),
                        device.getTelemetry().getTotalStorageMB(),
                        device.getTelemetry().getTotalMemoryMB(),
                        device.getTelemetry().getNetworkType(),
                        device.getTelemetry().getWifiSsid(),
                        device.getTelemetry().getAudioVolumePercent(),
                        device.getTelemetry().getAudioMuted(),
                        device.getTelemetry().getWifiSsidSharingEnabled(),
                        device.getTelemetry().getLatitude(),
                        device.getTelemetry().getLongitude(),
                        device.getTelemetry().getLocationAccuracyMeters(),
                        device.getTelemetry().getLocationCapturedAt(),
                        device.getTelemetry().getLocationSharingEnabled(),
                        device.getTelemetry().getCapturedAt());

        return new DevicesResponseDTO(
                device.getId(),
                device.getUser().getId(),
                device.getUser().getFirstName() + " " + device.getUser().getLastName(),
                getDeviceTypeName(device),
                device.getName(),
                device.getCustomName(),
                device.getHostname(),
                device.getOsName(),
                device.getOsVersion(),
                device.getIpAddress(),
                device.getMacAddress(),
                device.getBatteryLevel(),
                online,
                lastSeen == null ? null : DateTimeFormatter.ISO_INSTANT.format(lastSeen),
                online ? "online" : "offline",
                telemetry);
    }
}
