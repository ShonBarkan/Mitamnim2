import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for the Statistics & Analytics domain.
 */
export const statisticsService = {
  
  /**
   * Fetches aggregated stats for the group dashboard.
   * @param {string} startDate - ISO date string.
   * @param {string} endDate - ISO date string.
   */
  getDashboardStats: async (startDate, endDate) => {
    FrontendLogger.info('STATISTICS_SERVICE', `Fetching dashboard stats from ${startDate} to ${endDate}`);
    try {
      const response = await api.get('/statistics/dashboard', {
        params: { 
          start_date: startDate,
          end_date: endDate
        }
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_SERVICE', 'Failed to fetch dashboard stats', error);
      throw error;
    }
  },

  /**
   * Fetches raw statistics for the current athlete.
   * @param {string} startDate - ISO date string.
   * @param {string} endDate - ISO date string.
   */
  getMyStatistics: async (startDate, endDate) => {
    FrontendLogger.info('STATISTICS_SERVICE', `Fetching my-stats from ${startDate} to ${endDate}`);
    try {
      const response = await api.get('/statistics/my-stats', {
        params: { 
          start_date: startDate,
          end_date: endDate
        }
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_SERVICE', 'Failed to fetch my-stats', error);
      throw error;
    }
  },

  /**
   * Fetches raw statistics for group/users (Trainer only).
   * @param {string} startDate - ISO date string.
   * @param {string} endDate - ISO date string.
   * @param {Array<string>} [userIds] - Optional list of user IDs.
   */
  getGroupStatistics: async (startDate, endDate, userIds = null) => {
    FrontendLogger.info('STATISTICS_SERVICE', `Fetching group-stats for range ${startDate} - ${endDate}`);
    try {
      const params = new URLSearchParams();
      params.append('start_date', startDate);
      params.append('end_date', endDate);
      
      if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        userIds.forEach(id => {
          params.append('user_ids', id);
        });
      }

      const response = await api.get('/statistics/group-stats', {
        params: params
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('STATISTICS_SERVICE', 'Failed to fetch group-stats', error);
      throw error;
    }
  }
};

export default statisticsService;