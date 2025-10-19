package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.models.entities.DeviceSpecsEntity;
import com.bgyato.our_devices.repositories.IDeviceSpecsRepository;
import com.bgyato.our_devices.services.interfaces.IDeviceSpecsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DeviceSpecsServiceImpl implements IDeviceSpecsService {

    private final IDeviceSpecsRepository repository;

    @Override
    public DeviceSpecsEntity save(DeviceSpecsEntity specs) {
        return repository.save(specs);
    }

    @Override
    public Optional<DeviceSpecsEntity> findByDeviceId(String deviceId) {
        return Optional.ofNullable(repository.findByDevice_Id(deviceId));
    }

    @Override
    public void deleteByDeviceId(String deviceId) {
        Optional.ofNullable(repository.findByDevice_Id(deviceId))
                .ifPresent(spec -> repository.delete(spec));
    }
}
