package com.bgyato.our_devices.repositories;

import com.bgyato.our_devices.models.entities.DeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IDeviceRepository extends JpaRepository<DeviceEntity, String> {

    // Todos los dispositivos de un usuario
    List<DeviceEntity> findAllByUserIdAndIsDeletedFalse(String userId);

    // Buscar por nombre dentro de un usuario
    Optional<DeviceEntity> findByNameAndUserIdAndIsDeletedFalse(String name, String userId);

    // Verificar si un dispositivo ya existe para un usuario
    boolean existsByNameAndUserIdAndIsDeletedFalse(String name, String userId);

    Optional<DeviceEntity> findByIdAndIsDeletedFalse(String id);
    List<DeviceEntity> findByUserIdAndIsDeletedFalse(String userId);
    Optional<DeviceEntity> findByIpAddress(String ipAddress);
    Optional<DeviceEntity> findByUser_IdAndNameIgnoreCase(String userId, String name);

}
