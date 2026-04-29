import api from './api';

/**
 * UserService
 * Handles all user-related API calls including fetching group members,
 * creating, updating, and deleting users.
 */
export const userService = {
  /**
   * Fetches users belonging to a specific group.
   * If no groupId is provided, it attempts to fetch based on server-side context.
   * @param {string|null} groupId - The UUID of the group.
   */
  getGroupUsers: async (groupId = null) => {
    const url = groupId ? `/users/group?target_group_id=${groupId}` : '/users/group';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Registers a new user in the system.
   * @param {Object} userData - The new user's information.
   */
  createUser: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  /**
   * Updates an existing user's profile details.
   * NOTE: If you receive a 401 error here, ensure your token is valid
   * and included in the request headers via the api.js interceptor.
   * @param {string} userId - The UUID of the user to update.
   * @param {Object} updateData - The fields to be updated.
   */
  updateUser: async (userId, updateData) => {
    if (!userId) {
      throw new Error("userService.updateUser: Missing userId");
    }
    const response = await api.patch(`/users/${userId}`, updateData);
    return response.data;
  },

  /**
   * Deletes a user from the system.
   * @param {string} userId - The UUID of the user to be removed.
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};