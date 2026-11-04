package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.dto.device.DeviceConnectionLogCreateDTO;
import com.bgyato.our_devices.models.dto.device.DeviceConnectionLogResponseDTO;
import com.bgyato.our_devices.services.interfaces.IDeviceConnectionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/device-logs")
@RequiredArgsConstructor
public class DeviceConnectionLogController {

    private final IDeviceConnectionLogService logService;

    @PostMapping
    public ResponseEntity<DeviceConnectionLogResponseDTO> createLog(
            @Valid @RequestBody DeviceConnectionLogCreateDTO log,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(logService.logConnection(log, user.getUsername()));
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<List<DeviceConnectionLogResponseDTO>> getLogsByDevice(
            @PathVariable String deviceId, @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(logService.getLogsByDevice(deviceId, user.getUsername()));
    }

    @PatchMapping("/disconnect/{logId}")
    public ResponseEntity<Void> markDisconnection(@PathVariable String logId,
                                                  @AuthenticationPrincipal UserDetails user) {
        logService.markDisconnection(logId, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
