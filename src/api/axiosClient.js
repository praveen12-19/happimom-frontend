import axios from 'axios';

// Ready for backend integration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('API Error, falling back to mock state:', error.message);
    return Promise.reject(error);
  }
);

export default api;
