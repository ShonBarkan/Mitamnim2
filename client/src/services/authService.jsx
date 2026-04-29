import api from './api';

export const authService = {
  // Login function using form-data as required by OAuth2PasswordRequestForm
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/login', formData);
    return response.data; // returns {access_token, token_type}
  },

  // Fetches the current logged-in user details
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  }
};