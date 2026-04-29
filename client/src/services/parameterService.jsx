import api from './api';

export const parameterService = {
  // Get all available parameters
  getAll: () => api.get('/parameters'),
  
  // Create a new parameter definition
  create: (data) => api.post('/parameters', data),
  
  // Update an existing parameter
  update: (id, data) => api.patch(`/parameters/${id}`, data),
  
  // Remove a parameter
  delete: (id) => api.delete(`/parameters/${id}`)
};