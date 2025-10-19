package com.bgyato.our_devices.services.interfaces;


import com.bgyato.our_devices.models.dto.AuthRequest;
import com.bgyato.our_devices.models.dto.AuthResponse;

public interface IAuthService {
    public AuthResponse login(AuthRequest loginRequest);
}
