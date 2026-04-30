import api from './api';

/**
 * Service for handling Activity Logs (Performance Data).
 * In this architecture, each record represents a SINGLE SET.
 * 
 * performance_data follows a flat structure for one set:
 * [{"parameter_id": int, "value": string}, ...]
 * 
 * The Backend enriches the GET responses with:
 * "parameter_name" and "unit" for each parameter entry.
 */
export const activityService = {
  /**
   * Create a new activity log entry for a single set.
   * @param {Object} logData - { exercise_id, performance_data, workout_session_id }
   */
  create: (logData) => api.post('/activity-logs', logData),

  /**
   * Fetch personal logs (sets) for a specific exercise and all its descendants.
   * @param {number} exerciseId
   */
  getPersonalLogs: (exerciseId) => api.get(`/activity-logs/${exerciseId}`),

  /**
   * Fetch group logs for a specific exercise branch (Trainer/Admin only).
   * @param {number} exerciseId
   */
  getGroupLogs: (exerciseId) => api.get(`/trainer/group-logs/${exerciseId}`),

  /**
   * Update a specific activity log (single set).
   * @param {number} logId
   * @param {Object} updateData - { timestamp, performance_data }
   */
  update: (logId, updateData) => api.patch(`/activity-logs/${logId}`, updateData),

  /**
   * Delete a specific activity log entry (single set).
   * @param {number} logId
   */
  delete: (logId) => api.delete(`/activity-logs/${logId}`)
};

export default activityService;