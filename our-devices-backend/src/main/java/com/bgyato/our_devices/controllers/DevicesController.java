package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.models.dto.device.DevicesCreateDTO;
import com.bgyato.our_devices.models.dto.device.DevicesResponseDTO;
import com.bgyato.our_devices.models.dto.device.DevicesUpdateDTO;
import com.bgyato.our_devices.models.dto.device.DeviceHeartbeatDTO;
import com.bgyato.our_devices.services.interfaces.IDeviceService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/devices")
@AllArgsConstructor
public class DevicesController {

    private final IDeviceService deviceService;

    @PostMapping("")
    public ResponseEntity<DevicesResponseDTO> saveDevice(@RequestBody DevicesCreateDTO devicesCreateDTO,
                                                         @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deviceService.saveDevice(devicesCreateDTO, user.getUsername()));
    }

    @PutMapping("")
    public ResponseEntity<DevicesResponseDTO> updateDevice(@RequestParam String id,
                                                           @RequestBody DevicesUpdateDTO devicesUpdateDTO,
                                                           @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deviceService.updateDevice(devicesUpdateDTO, id, user.getUsername()));
    }

    @DeleteMapping("")  
    public ResponseEntity<Void> deleteDevice(@RequestParam String id, @AuthenticationPrincipal UserDetails user) {
        deviceService.deleteDevice(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DevicesResponseDTO> getDeviceById(@PathVariable String id,
                                                            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deviceService.getDeviceById(id, user.getUsername()));
    }

    @GetMapping("/by-user")
    public ResponseEntity<List<DevicesResponseDTO>> getDevicesByUserId(@RequestParam String userId,
                                                                       @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deviceService.getDevicesByUserId(userId, user.getUsername()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<DevicesResponseDTO>> getCurrentUserDevices(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deviceService.getDevicesForCurrentUser(user.getUsername()));
    }

    @PostMapping("/{id}/heartbeat")
    public ResponseEntity<DevicesResponseDTO> heartbeat(@PathVariable String id,
                                                        @Valid @RequestBody DeviceHeartbeatDTO heartbeat,
                                                        @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(deviceService.heartbeat(heartbeat, id, user.getUsername()));
    }

    @PostMapping("/{id}/disconnect")
    public ResponseEntity<Void> disconnect(@PathVariable String id,
                                           @AuthenticationPrincipal UserDetails user) {
        deviceService.disconnect(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
