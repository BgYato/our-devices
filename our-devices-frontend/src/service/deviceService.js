import axiosInstance from "../config/axiosConfig";

export const getDevices = async () => {
  try {
    const response = await axiosInstance.get("/devices/me");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo devices:", error);
    throw error;
  }
};

export const updateDevice = async (deviceId, deviceData) => {
  try {
    const response = await axiosInstance.put("/devices", deviceData, {
      params: { id: deviceId },
    });
    return response.data;
  } catch (error) {
    console.error("Error actualizando dispositivo:", error);
    throw error;
  }
};

export const deleteDevice = async (deviceId) => {
  try {
    await axiosInstance.delete("/devices", { params: { id: deviceId } });
  } catch (error) {
    console.error("Error eliminando dispositivo:", error);
    throw error;
  }
};

export const getDeviceSpecs = async (deviceId) => {
  try {
    const response = await axiosInstance.get(`/device-specs/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo especificaciones:", error);
    throw error;
  }
};
