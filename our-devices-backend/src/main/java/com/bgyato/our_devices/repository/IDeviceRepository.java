package com.bgyato.our_devices.repository;

import com.bgyato.our_devices.models.entities.DeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IDeviceRepository extends JpaRepository<DeviceEntity, String> {

    // Todos los dispositivos de un usuario
    List<DeviceEntity> findAllByUserIdAndIsDeletedFalse(String userId);

    // Buscar dispositivo específico por id
    Optional<DeviceEntity> findByIdAndIsDeletedFalse(String id);

    // Buscar por nombre dentro de un usuario
    Optional<DeviceEntity> findByNameAndUserIdAndIsDeletedFalse(String name, String userId);

    // Verificar si un dispositivo ya existe para un usuario
    boolean existsByNameAndUserIdAndIsDeletedFalse(String name, String userId);

    List<DeviceEntity> findByUserIdAndIsDeletedFalse(String userId);
}
