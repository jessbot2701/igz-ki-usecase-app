import axios from 'axios';
import { notifyGlobally } from '../context/NotificationContext';

export const apiClient = axios.create({ baseURL: '/api/v1' });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('igz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('igz_token');
      localStorage.removeItem('igz_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    } else {
      const message = error.response?.data?.message ?? 'Ein Fehler ist aufgetreten.';
      notifyGlobally(message, 'error');
    }
    return Promise.reject(error);
  }
);
