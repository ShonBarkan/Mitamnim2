import api from './api';
import FrontendLogger from '../utils/logger';

export const groupService = {
  /**
   * Fetch all groups (admin) or current user's group context boundary.
   * Path: GET /groups
   */
  getGroups: async () => {
    FrontendLogger.info('GROUP', 'Requesting group perimeter metadata records from server');
    const response = await api.get('/groups');
    return response.data;
  },

  /**
   * Create a new isolated group context pool (admin only).
   * Path: POST /groups
   */
  createGroup: async (groupData) => {
    FrontendLogger.info('GROUP', `Spawning new system group entity named: '${groupData.name}'`, groupData);
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  /**
   * Update group structural details or asset configurations.
   * Path: PATCH /groups/{groupId}
   */
  updateGroup: async (groupId, groupData) => {
    FrontendLogger.info('GROUP', `Mutating structural properties for group target id: ${groupId}`, groupData);
    const response = await api.patch(`/groups/${groupId}`, groupData);
    return response.data;
  },

  /**
   * Completely delete a group asset definition profile.
   * Path: DELETE /groups/{groupId}
   */
  deleteGroup: async (groupId) => {
    FrontendLogger.info('GROUP', `Completely purging group boundary asset record target id: ${groupId}`);
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  }
};