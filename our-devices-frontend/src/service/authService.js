import axiosInstance from "../config/axiosConfig";

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post("/users", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { description: "No se pudo crear la cuenta." };
  }
};

export const login = async (identifier, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      identifier,
      password,
    });

    const { token, user } = response.data;

    // Guardamos en localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("userInfo", JSON.stringify(user));

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Error de autenticación" };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/users/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "No se pudo obtener el usuario" };
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userInfo");
};
