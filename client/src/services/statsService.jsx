import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling data fetching for normalized performance charts and panoramic insights.
 */
export const statsService = {
  /**
   * Fetches chronological training history scores for the authenticated user.
   * @param {string} startDate - ISO Date format (YYYY-MM-DD)
   * @param {string} endDate - ISO Date format (YYYY-MM-DD)
   * Path: GET /stats/me
   */
  getPersonalStats: async (startDate, endDate) => {
    FrontendLogger.info('STATS', 'Querying chronological personal performance metrics data stream', { startDate, endDate });
    const response = await api.get(`/stats/me?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  },

  /**
   * Fetches multi-user matrix data for the coach's panoramic surveillance grid.
   * @param {string} startDate - ISO Date format (YYYY-MM-DD)
   * @param {string} endDate - ISO Date format (YYYY-MM-DD)
   * Path: GET /stats/group/panoramic
   */
  getGroupPanoramicStats: async (startDate, endDate) => {
    FrontendLogger.info('STATS', 'Extracting panoramic group multi-user surveillance analytics block', { startDate, endDate });
    const response = await api.get(`/stats/group/panoramic?start_date=${startDate}&end_date=${endDate}`);
    return response.data;
  }
};

export default statsService;