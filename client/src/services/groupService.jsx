import api from './api';

export const groupService = {
  // Fetch all groups (admin) or current user's group
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Create a new group (admin only)
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Update group details
  updateGroup: async (groupId, groupData) => {
    const response = await api.patch(`/groups/${groupId}`, groupData);
    return response.data;
  },

  // Delete a group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  }
};