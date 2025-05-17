import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const axiosAuth = axios.create();

axiosAuth.interceptors.request.use(
  (config) => {
    // Soporte para SSR y composición API
    let token;
    try {
      // Si estamos en un setup(), useAuthStore() funciona
      token = useAuthStore().token;
    } catch {
      // fallback: buscar en localStorage
      token = localStorage.getItem('token');
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosAuth; 