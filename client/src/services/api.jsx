import axios from 'axios';

// Get the API URL from environment variables or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to inject the JWT token into every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Handle request errors before they reach the server
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (like 401 unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: Logic for handling expired tokens (e.g., redirecting to login)
      console.warn("Unauthorized! Redirecting or clearing session...");
    }
    return Promise.reject(error);
  }
);

export default api;