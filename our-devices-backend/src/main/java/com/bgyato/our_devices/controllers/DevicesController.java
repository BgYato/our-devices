package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.dto.device.DevicesUpdateDTO;
import com.bgyato.our_devices.service.interfaces.IDeviceService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/devices")
@AllArgsConstructor
@CrossOrigin("http://localhost:5173/")
public class DevicesController {

    private final IDeviceService deviceService;

    @PostMapping("")
    public ResponseEntity<DevicesResponseDTO> saveDevice(@RequestBody DevicesCreateDTO devicesCreateDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceService.saveDevice(devicesCreateDTO));
    }

    @PutMapping("")
    public ResponseEntity<DevicesResponseDTO> updateDevice(@RequestParam String id,
                                                           @RequestBody DevicesUpdateDTO devicesUpdateDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceService.updateDevice(devicesUpdateDTO, id));
    }

    @DeleteMapping("")
    public ResponseEntity<Void> deleteDevice(@RequestParam String id) {
        deviceService.deleteDevice(id);
        return ResponseEntity.status(HttpStatus.OK).body(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DevicesResponseDTO> getDeviceById(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceService.getDeviceById(id));
    }

    @GetMapping("/by-user")
    public ResponseEntity<List<DevicesResponseDTO>> getDevicesByUserId(@RequestParam String userId) {
        return ResponseEntity.status(HttpStatus.OK).body(deviceService.getDevicesByUserId(userId));
    }
}

