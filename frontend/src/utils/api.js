import axios from 'axios';

// In development: Vite proxy forwards /api → http://localhost:5000
// In production:  VITE_API_URL must be set to your Render backend URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`|| '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lms_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
