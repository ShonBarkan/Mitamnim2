import api from './api';

/**
 * Service for handling Activity Logs (Performance Data).
 * All performance_data should follow the structure: 
 * [{"parameter_id": int, "parameter_name": string, "unit": string, "value": string}]
 */
export const activityService = {
  /**
   * Create a new activity log entry.
   * @param {Object} logData - { exercise_id, performance_data, workout_session_id }
   */
  create: (logData) => api.post('/activity-logs', logData),

  /**
   * Fetch personal logs for a specific exercise and all its descendants.
   * @param {number} exerciseId
   */
  getPersonalLogs: (exerciseId) => api.get(`/activity-logs/${exerciseId}`),

  /**
   * Fetch group logs for a specific exercise branch (Trainer/Admin only).
   * @param {number} exerciseId
   */
  getGroupLogs: (exerciseId) => api.get(`/trainer/group-logs/${exerciseId}`),

  /**
   * Update an existing activity log (timestamp or performance data).
   * @param {number} logId
   * @param {Object} updateData - { timestamp, performance_data }
   */
  update: (logId, updateData) => api.patch(`/activity-logs/${logId}`, updateData),

  /**
   * Delete an activity log entry.
   * @param {number} logId
   */
  delete: (logId) => api.delete(`/activity-logs/${logId}`)
};