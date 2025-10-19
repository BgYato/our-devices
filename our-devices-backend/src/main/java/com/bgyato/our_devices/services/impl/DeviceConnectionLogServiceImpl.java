package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.models.entities.DeviceConnectionLogEntity;
import com.bgyato.our_devices.repositories.IDeviceConnectionLogRepository;
import com.bgyato.our_devices.services.interfaces.IDeviceConnectionLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceConnectionLogServiceImpl implements IDeviceConnectionLogService {

    private final IDeviceConnectionLogRepository repository;

    @Override
    public DeviceConnectionLogEntity logConnection(DeviceConnectionLogEntity log) {
        return repository.save(log);
    }

    @Override
    public List<DeviceConnectionLogEntity> getLogsByDevice(String deviceId) {
        return repository.findByDevice_IdOrderByConnectionTimeDesc(deviceId);
    }

    @Override
    public void markDisconnection(String logId) {
        repository.findById(logId).ifPresent(log -> {
            log.setDisconnectionTime(new Date());
            repository.save(log);
        });
    }
}
