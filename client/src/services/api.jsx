import axios from 'axios';
import FrontendLogger from '../utils/logger';
import { setExternalLoading } from '../contexts/LoadingContext';
import { externalShowToast } from '../contexts/ToastContext';

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
    // Trigger global loader unless request explicitly opts out.
    try {
      if (!config.skipGlobalLoader) setExternalLoading(true);
    } catch (e) {
      // swallow: external bridge may be not registered yet
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
    // Clear global loader for completed requests
    try { if (!response.config?.skipGlobalLoader) setExternalLoading(false); } catch (e) {}

    FrontendLogger.info('API', `Inbound HTTP ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // Clear loader for errored requests
    try { if (!error.config?.skipGlobalLoader) setExternalLoading(false); } catch (e) {}

    if (error.response && error.response.status === 401) {
      FrontendLogger.warn('API', 'Unauthorized credentials footprint detected. Clearing session tracking parameters.');
      // Session eviction handling can be linked here securely
      try {
        externalShowToast('נדרש אימות מחדש. נא להתחבר שוב.', 'error');
      } catch (e) {}
    }

    // Try to show a friendly user-facing message (Hebrew).
    try {
      const respData = error.response?.data;
      const serverMsg = respData?.detail || respData?.message || respData?.error || null;
      const userMessage = serverMsg ? `שגיאה: ${serverMsg}` : (error.message && error.message.includes('Network Error') ? 'שגיאת רשת. בדוק את חיבור האינטרנט.' : 'אירעה שגיאה בשרת. אנא נסה שנית.');
      externalShowToast(userMessage, 'error');
    } catch (e) {
      // ignore toast errors
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