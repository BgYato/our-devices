import axiosInstance from "../config/axiosConfig";

const API_URL = import.meta.env.VITE_API_URL;

export const getDevices = async () => {
  try {
    const response = await axiosInstance.get(`${API_URL}/devices/me`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo devices:", error);
    throw error;
  }
};

export const addDevice = async (deviceData) => {
  try {
    const response = await axiosInstance.post(`${API_URL}/devices`, deviceData);
    return response.data;
  } catch (error) {
    console.error("Error agregando device:", error);
    throw error;
  }
};

export const updateDevice = async (deviceId, deviceData) => {
  try {
    const response = await axiosInstance.put(`${API_URL}/devices`, deviceData, {
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
    await axiosInstance.delete(`${API_URL}/devices`, { params: { id: deviceId } });
  } catch (error) {
    console.error("Error eliminando dispositivo:", error);
    throw error;
  }
};

export const getDeviceSpecs = async (deviceId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/device-specs/${deviceId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo especificaciones:", error);
    throw error;
  }
};
