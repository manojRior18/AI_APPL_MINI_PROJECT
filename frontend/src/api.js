import axios from 'axios';

// In dev: reads from .env.development (http://localhost:8000)
// In prod build: reads from .env.production (the ngrok URL you set before build)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gst_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gst_token');
      localStorage.removeItem('gst_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;