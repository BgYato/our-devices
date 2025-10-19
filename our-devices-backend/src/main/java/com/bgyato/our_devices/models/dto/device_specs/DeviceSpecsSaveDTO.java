package com.bgyato.our_devices.models.dto.device_specs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceSpecsSaveDTO {
    private String deviceId;
    private String cpuModel;
    private Integer cpuCores;
    private Integer ramSizeMB;
    private String gpuModel;
    private Long totalStorageMB;
    private Long freeStorageMB;
    private String architecture;
    private String screenResolution;
    private String lastUpdateVersion;
}
