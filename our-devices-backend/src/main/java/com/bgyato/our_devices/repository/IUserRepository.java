package com.bgyato.our_devices.repository;

import com.bgyato.our_devices.models.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<UserEntity, String> {

    // Buscar por email
    Optional<UserEntity> findByEmailAndIsDeletedFalse(String email);

    // Buscar por username (opcional si decides usarlo)
    Optional<UserEntity> findByUsernameAndIsDeletedFalse(String username);

    // Buscar por id
    Optional<UserEntity> findByIdAndIsDeletedFalse(String id);

    // Verificar existencia por email
    boolean existsByEmailAndIsDeletedFalse(String email);
}
