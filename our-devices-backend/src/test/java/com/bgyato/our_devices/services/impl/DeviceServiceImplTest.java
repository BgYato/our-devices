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
import java.util.Date;
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

        DeviceHeartbeatDTO heartbeat = new DeviceHeartbeatDTO();
        heartbeat.setIpAddress("192.168.1.50");
        heartbeat.setBatteryLevel(81);
        heartbeat.setCpuUsagePercent(24.5);
        heartbeat.setMemoryUsagePercent(48.0);
        heartbeat.setFreeStorageMB(512000L);
        DevicesResponseDTO response = service.heartbeat(heartbeat, "device-1", "owner@example.com");
        DeviceHeartbeatDTO nextHeartbeat = new DeviceHeartbeatDTO();
        nextHeartbeat.setIpAddress("192.168.1.51");
        nextHeartbeat.setBatteryLevel(75);
        nextHeartbeat.setCpuUsagePercent(12.0);
        nextHeartbeat.setMemoryUsagePercent(40.0);
        nextHeartbeat.setFreeStorageMB(400000L);
        DevicesResponseDTO latestResponse = service.heartbeat(
                nextHeartbeat, "device-1", "owner@example.com");

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
    void heartbeatStoresMobileStorageAndOptInLocation() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));
        when(telemetryRepository.findByDevice_Id("device-1")).thenReturn(Optional.empty());
        when(telemetryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(deviceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        DeviceHeartbeatDTO heartbeat = new DeviceHeartbeatDTO();
        heartbeat.setFreeStorageMB(128000L);
        heartbeat.setTotalStorageMB(512000L);
        heartbeat.setTotalMemoryMB(8192L);
        heartbeat.setLatitude(4.7110);
        heartbeat.setLongitude(-74.0721);
        heartbeat.setLocationAccuracyMeters(12.5);
        heartbeat.setLocationSharingEnabled(true);

        DevicesResponseDTO response = service.heartbeat(heartbeat, "device-1", "owner@example.com");

        assertEquals(128000L, response.getTelemetry().getFreeStorageMB());
        assertEquals(512000L, response.getTelemetry().getTotalStorageMB());
        assertEquals(8192L, response.getTelemetry().getTotalMemoryMB());
        assertEquals(4.7110, response.getTelemetry().getLatitude());
        assertEquals(-74.0721, response.getTelemetry().getLongitude());
        assertEquals(12.5, response.getTelemetry().getLocationAccuracyMeters());
        assertTrue(response.getTelemetry().getLocationSharingEnabled());
        assertNotNull(response.getTelemetry().getLocationCapturedAt());
    }

    @Test
    void disablingLocationSharingClearsPreviouslyStoredCoordinates() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        DeviceTelemetryEntity currentTelemetry = DeviceTelemetryEntity.builder()
                .id("telemetry-1")
                .device(device)
                .latitude(4.7110)
                .longitude(-74.0721)
                .locationAccuracyMeters(12.5)
                .locationCapturedAt(Instant.now())
                .locationSharingEnabled(true)
                .build();
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));
        when(telemetryRepository.findByDevice_Id("device-1")).thenReturn(Optional.of(currentTelemetry));
        when(telemetryRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(deviceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        DeviceHeartbeatDTO heartbeat = new DeviceHeartbeatDTO();
        heartbeat.setLocationSharingEnabled(false);

        DevicesResponseDTO response = service.heartbeat(heartbeat, "device-1", "owner@example.com");

        assertFalse(response.getTelemetry().getLocationSharingEnabled());
        assertNull(response.getTelemetry().getLatitude());
        assertNull(response.getTelemetry().getLongitude());
        assertNull(response.getTelemetry().getLocationCapturedAt());
    }

    @Test
    void staleDeviceHeartbeatIsReportedOffline() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        device.setOnline(true);
        device.setLastSeen(Date.from(Instant.now().minusSeconds(91)));
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));

        DevicesResponseDTO response = service.getDeviceById("device-1", "owner@example.com");

        assertFalse(response.getIsOnline());
        assertEquals("offline", response.getStatus());
    }

    @Test
    void disconnectImmediatelyMarksDeviceOffline() {
        DeviceEntity device = deviceOwnedBy("owner@example.com");
        device.setOnline(true);
        when(deviceRepository.findByIdAndIsDeletedFalse("device-1")).thenReturn(Optional.of(device));
        when(deviceRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        service.disconnect("device-1", "owner@example.com");

        assertFalse(device.isOnline());
        verify(deviceRepository).save(device);
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
