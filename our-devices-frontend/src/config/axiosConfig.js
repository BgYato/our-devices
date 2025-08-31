import { jwtDecode } from "jwt-decode";
import { navigateTo } from "../utils/navigate";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getToken = () => localStorage.getItem("token");
const getUserInfo = () => {
  try {
    return JSON.parse(localStorage.getItem("userInfo"));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp ? decoded.exp < currentTime : false;
  } catch {
    return true;
  }
};

const publicRoutes = [
  { method: "ANY", path: /^\/auth\/.*/ },
  { method: "POST", path: "/users" },
  { method: "GET", path: /^\/users\/validate\/.+$/ },
  { method: "POST", path: "/users/resend-validation" },
];

const isPublicRoute = (config) => {
  const method = config.method?.toUpperCase();
  const url = config.url?.replace(/^https?:\/\/[^/]+/, "");

  return publicRoutes.some((route) => {
    const methodMatches = route.method === "ANY" || route.method === method;
    const pathMatches =
      typeof route.path === "string"
        ? route.path === url
        : route.path.test(url);
    return methodMatches && pathMatches;
  });
};

let isRedirecting = false;

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    const userInfo = getUserInfo();

    if (!userInfo && !isPublicRoute(config) && !isRedirecting) {
      isRedirecting = true;
      navigateTo("/login");
    }

    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem("token");
        if (!isPublicRoute(config) && !isRedirecting) {
          isRedirecting = true;
          navigateTo("/login", { state: { sessionExpired: true } });
        }
      } else if (!isPublicRoute(config)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
