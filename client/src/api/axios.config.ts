import axios from "axios";

const URL_BACK = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const axiosInstance = axios.create({
  baseURL: URL_BACK,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;