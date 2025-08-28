package com.bgyato.our_devices.service.impl;

import com.bgyato.our_devices.exceptions.commons.BadCredentialsException;
import com.bgyato.our_devices.exceptions.commons.EntityAlreadyExistsException;
import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.models.dto.*;
import com.bgyato.our_devices.models.dto.user.UsersCreateDTO;
import com.bgyato.our_devices.models.dto.user.UsersResponseDTO;
import com.bgyato.our_devices.models.dto.user.UsersUpdateDTO;
import com.bgyato.our_devices.models.dto.user.UsersUpdatePasswordDTO;
import com.bgyato.our_devices.models.entities.UserEntity;
import com.bgyato.our_devices.repository.IUserRepository;
import com.bgyato.our_devices.service.interfaces.IUserService;

import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class UserServiceImpl implements IUserService {

    private final IUserRepository userRepository;
    private ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtServiceImpl jwtService;

    @Override
    public UsersResponseDTO saveUser(UsersCreateDTO userCreateDTO) {
        if (validateIfUserExistsBeforeSave(userCreateDTO.getEmail(), userCreateDTO.getUsername())) {
            throw new EntityAlreadyExistsException("El correo o nombre de usuario ya se encuentra registrado");
        }

        UserEntity user = modelMapper.map(userCreateDTO, UserEntity.class);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        return modelMapper.map(user, UsersResponseDTO.class);
    }

    @Override
    public List<UsersResponseDTO> getAll() {
        return userRepository.findAll().stream().map(
                user -> modelMapper.map(user, UsersResponseDTO.class)
        ).toList();
    }

    @Override
    public UsersResponseDTO getUserById(String id) {
        Optional<UserEntity> user = userRepository.findById(id);
        if (user.isEmpty()) throw new EntityNotFoundException("El usuario no existe");
        return modelMapper.map(user, UsersResponseDTO.class);
    }

    @Override
    public UsersResponseDTO updateUser(String id, UsersUpdateDTO userUpdateDTO) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado al usuario mediante el ID."));

        if (userUpdateDTO.getFirstName() != null) {
            user.setFirstName(userUpdateDTO.getFirstName());
        }

        if (userUpdateDTO.getLastName() != null) {
            user.setLastName(userUpdateDTO.getLastName());
        }

        if (userUpdateDTO.getEmail() != null && !userUpdateDTO.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndIsDeletedFalse(userUpdateDTO.getEmail())) {
                throw new EntityAlreadyExistsException("El correo ya existe en la base de datos");
            }
            user.setEmail(userUpdateDTO.getEmail());
        }

        if (userUpdateDTO.getUsername() != null && !userUpdateDTO.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsernameAndIsDeletedFalse(userUpdateDTO.getUsername())) {
                throw new EntityAlreadyExistsException("El nombre de usuario ya existe en la base de datos");
            }
            user.setUsername(userUpdateDTO.getUsername());
        }

        userRepository.save(user);

        return modelMapper.map(user, UsersResponseDTO.class);
    }

    @Override
    public void updatePasswordUser(String id, UsersUpdatePasswordDTO usersUpdatePasswordDTO) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado al usuario mediante el ID."));

        if (!passwordEncoder.matches(usersUpdatePasswordDTO.getLastPassword(), user.getPassword())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta.");
        }

        user.setPassword(passwordEncoder.encode(usersUpdatePasswordDTO.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public void deleteUser(String authorizationHeader, PasswordDTO password) {
        String token =  authorizationHeader.replace("Bearer ", "");
        String email =  jwtService.getEmailFromToken(token);
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró al usuario con dicho correo."));

        if (!passwordEncoder.matches(password.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta.");
        }

        user.setDeleted(true);
        userRepository.save(user);
    }

    @Override
    public UsersResponseDTO getCurrentUser(String authorizationHeader) {
        String token =  authorizationHeader.replace("Bearer ", "");
        String email =  jwtService.getEmailFromToken(token);
        UserEntity user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró al usuario con dicho correo."));
        return modelMapper.map(user, UsersResponseDTO.class);
    }


    private boolean validateIfUserExistsBeforeSave(String email, String username) {
        if (email == null && username == null) {
            return false;
        }
        return userRepository.existsByEmailOrUsernameAndIsDeletedFalse(email, username);
    }

}
