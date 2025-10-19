package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.entities.DeviceSpecsEntity;
import com.bgyato.our_devices.services.interfaces.IDeviceSpecsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/device-specs")
@RequiredArgsConstructor
public class DeviceSpecsController {

    private final IDeviceSpecsService deviceSpecsService;

    @PostMapping
    public ResponseEntity<DeviceSpecsEntity> saveSpecs(@RequestBody DeviceSpecsEntity specs) {
        return ResponseEntity.ok(deviceSpecsService.save(specs));
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<DeviceSpecsEntity> getByDeviceId(@PathVariable String deviceId) {
        return deviceSpecsService.findByDeviceId(deviceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{deviceId}")
    public ResponseEntity<Void> deleteByDeviceId(@PathVariable String deviceId) {
        deviceSpecsService.deleteByDeviceId(deviceId);
        return ResponseEntity.noContent().build();
    }
}
