import api from './api';

export const userService = {
  // Get all users in the group (or all if admin)
  getGroupUsers: async (groupId = null) => {
    const url = groupId ? `/users/group?target_group_id=${groupId}` : '/users/group';
    const response = await api.get(url);
    return response.data;
  },

  // Create a new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update an existing user (PATCH)
  updateUser: async (userId, updateData) => {
    const response = await api.patch(`/users/${userId}`, updateData);
    return response.data;
  },

  // Delete a user
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};