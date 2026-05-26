import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for the Statistics & Analytics domain.
 */
export const statisticsService = {
  
  /**
   * Fetches aggregated stats for the group dashboard.
   * @param {string} period - 'today', 'week', or 'month'
   */
  getDashboardStats: async (period = 'today') => {
    FrontendLogger.info('STATISTICS_SERVICE', `Fetching dashboard stats for period: ${period}`);
    try {
      const response = await api.get('/statistics/dashboard', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_SERVICE', `Failed to fetch dashboard stats for period: ${period}`, error);
      throw error;
    }
  },

  /**
   * Fetches historical trend data for a specific athlete.
   * @param {string} athleteId - The UUID of the athlete
   * @param {string} parameterName - e.g., 'Weight', 'Reps'
   * @param {number|null} exerciseId - Optional exercise filter
   * @param {number} monthsBack - Number of months of history to retrieve
   */
  getAthleteStats: async (athleteId, parameterName, exerciseId = null, monthsBack = 3) => {
    FrontendLogger.info('STATISTICS_SERVICE', `Fetching stats for athlete: ${athleteId}`);
    try {
      const response = await api.get(`/statistics/athlete/${athleteId}`, {
        params: { 
          parameter_name: parameterName, 
          exercise_id: exerciseId, 
          months_back: monthsBack 
        }
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_SERVICE', `Failed to fetch stats for athlete: ${athleteId}`, error);
      throw error;
    }
  },

  /**
   * Fetches aggregated trend data for the entire group.
   * @param {string} parameterName - e.g., 'Weight', 'Reps'
   * @param {number|null} exerciseId - Optional exercise filter
   * @param {number} monthsBack - Number of months of history to retrieve
   */
  getGroupTrends: async (parameterName, exerciseId = null, monthsBack = 3) => {
    FrontendLogger.info('STATISTICS_SERVICE', 'Fetching group trend statistics');
    try {
      const response = await api.get('/statistics/group', {
        params: { 
          parameter_name: parameterName, 
          exercise_id: exerciseId, 
          months_back: monthsBack 
        }
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_SERVICE', 'Failed to fetch group trends', error);
      throw error;
    }
  }
};

export default statisticsService;