import axiosInstance from "../config/axiosConfig";

const API_URL = import.meta.env.VITE_API_URL;

export const getDevices = async (userId) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/devices/by-user`, {
      params: { userId },
    });
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

export const updateLastSeen = async (id) => {
  try {
    const payload = { lastSeen: new Date().toISOString() };
    const response = await axiosInstance.put(`${API_URL}/devices`, payload, {
      params: { id },
    });
    return response.data;
  } catch (error) {
    console.error("Error actualizando lastSeen:", error);
    throw error;
  }
};
