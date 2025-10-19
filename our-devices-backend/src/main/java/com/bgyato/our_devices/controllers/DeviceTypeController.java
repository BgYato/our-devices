package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.dto.device_type.DevicesTypeResponseDTO;
import com.bgyato.our_devices.models.dto.device_type.DevicesTypeSaveDTO;
import com.bgyato.our_devices.models.entities.DeviceTypeEntity;
import com.bgyato.our_devices.services.interfaces.IDeviceTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/device-types")
@RequiredArgsConstructor
public class DeviceTypeController {

    private final IDeviceTypeService deviceTypeService;

    @PostMapping
    public ResponseEntity<DevicesTypeResponseDTO> createType(@RequestBody DevicesTypeSaveDTO type) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceTypeService.create(type));
    }

    @GetMapping
    public ResponseEntity<List<DevicesTypeResponseDTO>> getAllTypes() {
        return ResponseEntity.status(HttpStatus.OK).body(deviceTypeService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DevicesTypeResponseDTO> getTypeById(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceTypeService.findById(id));
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<DevicesTypeResponseDTO> getTypeByName(@PathVariable String name) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceTypeService.findByName(name));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DevicesTypeResponseDTO> updateType(@PathVariable String id, @RequestBody DevicesTypeSaveDTO type) {
        return ResponseEntity.ok(deviceTypeService.update(id, type));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteType(@PathVariable String id) {
        deviceTypeService.delete(id);
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}
