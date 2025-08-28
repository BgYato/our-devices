package com.bgyato.our_devices.service.interfaces;

import com.bgyato.our_devices.models.dto.*;
import com.bgyato.our_devices.models.dto.user.UsersCreateDTO;
import com.bgyato.our_devices.models.dto.user.UsersResponseDTO;
import com.bgyato.our_devices.models.dto.user.UsersUpdateDTO;
import com.bgyato.our_devices.models.dto.user.UsersUpdatePasswordDTO;

import java.util.List;

public interface IUserService {

    UsersResponseDTO saveUser(UsersCreateDTO userCreateDTO);
    List<UsersResponseDTO> getAll();
    UsersResponseDTO getUserById(String id);
    UsersResponseDTO updateUser(String id, UsersUpdateDTO userUpdateDTO);
    void updatePasswordUser(String id, UsersUpdatePasswordDTO usersUpdatePasswordDTO);
    void deleteUser(String authorizationHeader, PasswordDTO password);
    UsersResponseDTO getCurrentUser(String authorizationHeader);
}
