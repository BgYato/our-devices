package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.dto.device.DeviceHeartbeatDTO;
import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.entities.DeviceEntity;
import com.bgyato.our_devices.models.entities.DeviceTelemetryEntity;
import com.bgyato.our_devices.models.entities.DeviceTypeEntity;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repositories.IDeviceRepository;
import com.bgyato.our_devices.repositories.IDeviceTelemetryRepository;
import com.bgyato.our_devices.repositories.IDeviceTypeRepository;
import com.bgyato.our_devices.repositories.IUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceServiceImplTest {

    @Mock
    private IDeviceRepository deviceRepository;
    @Mock
    private IUserRepository userRepository;
    @Mock
    private IDeviceTypeRepository deviceTypeRepository;
    @Mock
    private IDeviceTelemetryRepository telemetryRepository;

    @InjectMocks
    private DeviceServiceImpl service;

    @Test
    void refusesToReadAnotherUsersDevice() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));

        assertThrows(
                EntityNotFoundException.class,
                () -> service.getDeviceById("device-1", "other@example.com"));

        verify(deviceRepository, never()).save(any());
    }

    @Test
    void heartbeatUsesServerTimeAndStoresOnlyLatestTelemetry() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        DeviceTelemetryEntity currentTelemetry = DeviceTelemetryEntity.builder()
                .id("telemetry-1")
                .device(device)
                .build();
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));
        when(telemetryRepository.findByDevice_Id("device-1"))
                .thenReturn(Optional.empty(), Optional.of(currentTelemetry));
        when(telemetryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(deviceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        DeviceHeartbeatDTO heartbeat = new DeviceHeartbeatDTO(
                "192.168.1.50", 81, 24.5, 48.0, 512000L);
        DevicesResponseDTO response = service.heartbeat(heartbeat, "device-1", "owner@example.com");
        DevicesResponseDTO latestResponse = service.heartbeat(
                new DeviceHeartbeatDTO("192.168.1.51", 75, 12.0, 40.0, 400000L),
                "device-1",
                "owner@example.com");

        assertTrue(response.getIsOnline());
        assertNotNull(response.getLastSeen());
        Instant lastSeen = Instant.parse(latestResponse.getLastSeen());
        assertTrue(lastSeen.isAfter(Instant.now().minusSeconds(10)));
        assertTrue(lastSeen.isBefore(Instant.now().plusSeconds(1)));
        assertEquals(75, latestResponse.getTelemetry().getBatteryLevel());
        assertEquals(12.0, latestResponse.getTelemetry().getCpuUsagePercent());
        assertEquals(40.0, latestResponse.getTelemetry().getMemoryUsagePercent());
        assertEquals(400000L, latestResponse.getTelemetry().getFreeStorageMB());
        assertNotNull(latestResponse.getTelemetry().getCapturedAt());
        verify(telemetryRepository, times(2)).save(any(DeviceTelemetryEntity.class));
    }

    @Test
    void createsAndAssignsRequestedDeviceType() {
        UserEntity user = UserEntity.builder()
                .id("owner-1")
                .email("owner@example.com")
                .firstName("Test")
                .lastName("User")
                .build();
        DeviceTypeEntity laptop = DeviceTypeEntity.builder().id("type-laptop").name("Laptop").build();
        when(userRepository.findByEmailAndIsDeletedFalse("owner@example.com")).thenReturn(Optional.of(user));
        when(deviceRepository.findByUser_IdAndNameIgnoreCaseAndIsDeletedFalse("owner-1", "Laptop test"))
                .thenReturn(Optional.empty());
        when(deviceTypeRepository.findByNameIgnoreCaseAndIsDeletedFalse("Laptop"))
                .thenReturn(Optional.empty());
        when(deviceTypeRepository.save(any(DeviceTypeEntity.class))).thenReturn(laptop);
        when(deviceRepository.save(any(DeviceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DevicesCreateDTO dto = new DevicesCreateDTO();
        dto.setName("Laptop test");
        dto.setDeviceTypeName("Laptop");
        DevicesResponseDTO response = service.saveDevice(dto, "owner@example.com");

        assertEquals("Laptop", response.getDeviceTypeName());
        verify(deviceTypeRepository).save(any(DeviceTypeEntity.class));
    }

    @Test
    void infersDesktopTypeForLegacyDeviceWithoutType() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));

        DevicesResponseDTO response = service.getDeviceById("device-1", "owner@example.com");

        assertEquals("Escritorio", response.getDeviceTypeName());
    }

    private DeviceEntity deviceOwnedBy(String email) {
        UserEntity user = UserEntity.builder()
                .id("owner-1")
                .email(email)
                .firstName("Test")
                .lastName("User")
                .build();
        return DeviceEntity.builder()
                .id("device-1")
                .name("Test device")
                .user(user)
                .build();
    }
}
