import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * UserService
 * Handles all user-related API calls including fetching group members,
 * creating, updating, and deleting users within group perimeters.
 */
export const userService = {
  /**
   * Fetches users belonging to a specific group perimeter scope.
   * @param {string|null} groupId - The UUID of the group.
   */
  getGroupUsers: async (groupId = null) => {
    const url = groupId ? `/users/group/?target_group_id=${groupId}` : '/users/group/';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Registers a new user account profile in the system registry pool.
   * @param {Object} userData - The new user's information.
   */
  createUser: async (userData) => {
    FrontendLogger.info('USER', `Spawning new user credential profile node for username: '${userData.username}'`, userData);
    const response = await api.post('/users/', userData);
    return response.data;
  },

  /**
   * Updates an existing user's profile metadata details.
   * @param {string} userId - The UUID of the user to update.
   * @param {Object} updateData - The fields to be updated.
   */
  updateUser: async (userId, updateData) => {
    if (!userId) {
      FrontendLogger.error('USER', 'Aborting user mutation transaction sequence: Missing target userId validation parameter');
      throw new Error("userService.updateUser: Missing userId");
    }
    FrontendLogger.info('USER', `Mutating profile field attribute boundaries for user node id: ${userId}`, updateData);
    const response = await api.patch(`/users/${userId}/`, updateData);
    return response.data;
  },

  /**
   * Deletes a user profile record and evicts authorization access tokens.
   * @param {string} userId - The UUID of the user to be removed.
   */
  deleteUser: async (userId) => {
    FrontendLogger.info('USER', `Evicting user security entity registration row asset for user id: ${userId}`);
    const response = await api.delete(`/users/${userId}/`);
    return response.data;
  }
};