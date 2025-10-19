package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.exceptions.commons.EntityAlreadyExistsException;
import com.bgyato.our_devices.exceptions.commons.EntityNotFoundException;
import com.bgyato.our_devices.exceptions.commons.InvalidFieldFormatException;
import com.bgyato.our_devices.models.dto.device_type.DevicesTypeResponseDTO;
import com.bgyato.our_devices.models.dto.device_type.DevicesTypeSaveDTO;
import com.bgyato.our_devices.models.entities.DeviceTypeEntity;
import com.bgyato.our_devices.repositories.IDeviceTypeRepository;
import com.bgyato.our_devices.services.interfaces.IDeviceTypeService;
import lombok.AllArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class DeviceTypeServiceImpl implements IDeviceTypeService {

    private final IDeviceTypeRepository repository;
    private ModelMapper modelMapper;

    @Override
    public DevicesTypeResponseDTO create(DevicesTypeSaveDTO type) {
        validateNameFormat(type.getName());

        if (repository.findByNameIgnoreCaseAndIsDeletedFalse(type.getName()).isPresent()) throw new EntityAlreadyExistsException("Ya existe un tipo con el mismo nombre");

        DeviceTypeEntity entity = modelMapper.map(type, DeviceTypeEntity.class);

        repository.save(entity);

        return modelMapper.map(entity, DevicesTypeResponseDTO.class);
    }

    @Override
    public List<DevicesTypeResponseDTO> getAll() {
        return repository.findAllByIsDeletedFalse().stream().map(
                type -> modelMapper.map(type, DevicesTypeResponseDTO.class)
        ).toList();
    }

    @Override
    public DevicesTypeResponseDTO findById(String id) {
        DeviceTypeEntity entity = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado el tipo con id " + id));
        return modelMapper.map(entity, DevicesTypeResponseDTO.class);
    }


    @Override
    public DevicesTypeResponseDTO findByName(String name) {
        DeviceTypeEntity entity = repository.findByNameIgnoreCaseAndIsDeletedFalse(name).orElseThrow(
                () -> new EntityNotFoundException("No se ha encontrado el tipo con nombre "+name));
        return modelMapper.map(entity, DevicesTypeResponseDTO.class);
    }

    @Override
    public DevicesTypeResponseDTO update(String id, DevicesTypeSaveDTO type) {
        validateNameFormat(type.getName());

        DeviceTypeEntity entity = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado al tipo mediante ID "+id));

        if (type.getName().equalsIgnoreCase(entity.getName()) &&
                ((type.getDescription() == null && entity.getDescription() == null) ||
                        (type.getDescription() != null && type.getDescription().equals(entity.getDescription())))) {
            throw new EntityAlreadyExistsException("No se ha realizado ningún cambio en los campos.");
        }

        if (!entity.getName().equalsIgnoreCase(type.getName())) {
            repository.findByNameIgnoreCaseAndIsDeletedFalse(type.getName())
                    .ifPresent(existing -> { throw new EntityAlreadyExistsException("Ya existe un tipo con dicho nombre."); });
            entity.setName(type.getName());
        }

        if (type.getDescription()!=null) entity.setDescription(type.getDescription());

        repository.save(entity);

        return modelMapper.map(entity, DevicesTypeResponseDTO.class);
    }

    @Override
    public void delete(String id) {
        DeviceTypeEntity entity = repository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("No se ha encontrado el tipo con id " + id));

        entity.setDeleted(true);
        repository.save(entity);
    }

    private void validateNameFormat(String name) {
        if (!name.matches("^[A-Za-z0-9 ]+$")) {
            throw new InvalidFieldFormatException(
                    "El nombre solo puede contener letras sin acentos, números y espacios. " +
                            "No se permiten símbolos ni caracteres especiales."
            );
        }
    }

}
