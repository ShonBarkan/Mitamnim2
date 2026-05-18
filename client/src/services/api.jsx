import axios from 'axios';
import FrontendLogger from '../utils/logger';

// Get the API URL from environment variables or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to inject the JWT token and trace outbound pipelines
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    FrontendLogger.info('API', `Outbound HTTP ${config.method.toUpperCase()} to ${config.url}`, config.data);
    return config;
  },
  (error) => {
    FrontendLogger.error('API', 'HTTP Request Pipeline Configuration Fault', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle metrics tracking and global system faults
api.interceptors.response.use(
  (response) => {
    FrontendLogger.info('API', `Inbound HTTP ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      FrontendLogger.warn('API', 'Unauthorized credentials footprint detected. Clearing session tracking parameters.');
      // Session eviction handling can be linked here securely
    }
    
    FrontendLogger.error(
      'API', 
      `HTTP Failure Core Exception caught on ${error.config?.url || 'unknown endpoint'}`, 
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default api;