package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.entities.DeviceConnectionLogEntity;
import com.bgyato.our_devices.services.interfaces.IDeviceConnectionLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/device-logs")
@RequiredArgsConstructor
public class DeviceConnectionLogController {

    private final IDeviceConnectionLogService logService;

    @PostMapping
    public ResponseEntity<DeviceConnectionLogEntity> createLog(@RequestBody DeviceConnectionLogEntity log) {
        return ResponseEntity.ok(logService.logConnection(log));
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<List<DeviceConnectionLogEntity>> getLogsByDevice(@PathVariable String deviceId) {
        return ResponseEntity.ok(logService.getLogsByDevice(deviceId));
    }

    @PatchMapping("/disconnect/{logId}")
    public ResponseEntity<Void> markDisconnection(@PathVariable String logId) {
        logService.markDisconnection(logId);
        return ResponseEntity.noContent().build();
    }
}
