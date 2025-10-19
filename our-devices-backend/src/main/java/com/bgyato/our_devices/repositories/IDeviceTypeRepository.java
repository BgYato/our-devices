package com.bgyato.our_devices.repositories;

import com.bgyato.our_devices.models.entities.DeviceTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IDeviceTypeRepository extends JpaRepository<DeviceTypeEntity, String> {
    Optional<DeviceTypeEntity> findByNameIgnoreCaseAndIsDeletedFalse(String name);
    List<DeviceTypeEntity> findAllByIsDeletedFalse();
    Optional<DeviceTypeEntity> findByIdAndIsDeletedFalse(String id);
}
