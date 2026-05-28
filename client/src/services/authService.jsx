import api from './api';
import FrontendLogger from '../utils/logger';

export const authService = {
  // Login function using form-data as required by OAuth2PasswordRequestForm
  login: async (username, password) => {
    FrontendLogger.info('AUTH', `Initiating token credential verification sequence for user: '${username}'`);
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/login', formData);
    FrontendLogger.info('AUTH', `Credential validation verified. Session token established for user: '${username}'`);
    return response.data; // returns {access_token, token_type}
  },

  // Fetches the current logged-in user details
  getCurrentUser: async () => {
    FrontendLogger.info('AUTH', 'Requesting authenticated user profile payload from remote session context');
    const response = await api.get('/users/me/');
    return response.data;
  }
};