package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.dto.device_specs.DeviceSpecsResponseDTO;
import com.bgyato.our_devices.models.dto.device_specs.DeviceSpecsSaveDTO;
import com.bgyato.our_devices.models.entities.DeviceSpecsEntity;
import com.bgyato.our_devices.services.interfaces.IDeviceSpecsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/device-specs")
@RequiredArgsConstructor
public class DeviceSpecsController {

    private final IDeviceSpecsService deviceSpecsService;

    @PostMapping
    public ResponseEntity<DeviceSpecsResponseDTO> saveSpecs(@RequestBody DeviceSpecsSaveDTO specs) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceSpecsService.save(specs));
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<DeviceSpecsResponseDTO> getByDeviceId(@PathVariable String deviceId) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceSpecsService.findByDeviceId(deviceId));
    }
}
