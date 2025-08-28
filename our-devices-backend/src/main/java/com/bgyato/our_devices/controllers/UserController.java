package com.bgyato.our_devices.controllers;

import com.bgyato.our_devices.commons.constants.security.SecurityConstants;
import com.bgyato.our_devices.models.dto.*;
import com.bgyato.our_devices.models.dto.user.UsersCreateDTO;
import com.bgyato.our_devices.models.dto.user.UsersResponseDTO;
import com.bgyato.our_devices.models.dto.user.UsersUpdateDTO;
import com.bgyato.our_devices.models.dto.user.UsersUpdatePasswordDTO;
import com.bgyato.our_devices.service.interfaces.IUserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@AllArgsConstructor
@CrossOrigin("http://localhost:5173/")
public class UserController {

    private final IUserService userService;

    @PostMapping("")
    public ResponseEntity<UsersResponseDTO> saveUser(@RequestBody UsersCreateDTO usersCreateDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(userService.saveUser(usersCreateDTO));
    }

    @PutMapping("")
    public ResponseEntity<UsersResponseDTO> updateUser(@RequestParam String id, @RequestBody UsersUpdateDTO usersUpdateDTO) {
        return ResponseEntity.status(HttpStatus.OK).body(userService.updateUser(id, usersUpdateDTO));
    }

    @PutMapping("/update-password")
    public ResponseEntity<Void> updatePasswordUser(@RequestParam String id, @RequestBody UsersUpdatePasswordDTO usersUpdatePasswordDTO) {
        userService.updatePasswordUser(id, usersUpdatePasswordDTO);
        return ResponseEntity.status(HttpStatus.OK).body(null);
    }

    @DeleteMapping("")
    public ResponseEntity<Void> deleteUser(@RequestHeader(SecurityConstants.JWT_HEADER) String authorizationHeader, @RequestBody PasswordDTO passwordDTO) {
        userService.deleteUser(authorizationHeader, passwordDTO);
        return ResponseEntity.status(HttpStatus.OK).body(null);
    }

    @GetMapping("")
    public ResponseEntity<List<UsersResponseDTO>> getAllUsers() {
        return ResponseEntity.status(HttpStatus.OK).body(userService.getAll());
    }

    @GetMapping("/me")
    public ResponseEntity<UsersResponseDTO> getCurrentUser(@RequestHeader(SecurityConstants.JWT_HEADER) String authorizationHeader) {
        return ResponseEntity.status(HttpStatus.OK).body(userService.getCurrentUser(authorizationHeader));
    }
}
