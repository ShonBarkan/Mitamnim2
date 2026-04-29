import api from './api';

export const exerciseService = {
  getAll: () => api.get('/exercises'),
  create: (data) => api.post('/exercises', data),
  update: (id, data) => api.patch(`/exercises/${id}`, data),
  delete: (id) => api.delete(`/exercises/${id}`),
  getActiveParams: (id) => api.get(`/exercises/${id}/active-params`)
};