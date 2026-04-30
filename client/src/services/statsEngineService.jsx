import api from './api';

/**
 * Service for interacting with the Statistics Engine.
 * Handles performance history and group-wide leaderboard data.
 * All logic related to Formulas and Conversions has been removed to align with the core engine update.
 */
const statsEngineService = {
    /**
     * Fetches personal performance trends for a specific exercise.
     * Aggregates data across the exercise hierarchy and applies parameter-specific 
     * aggregation strategies (Sum, Max, Avg, etc.) defined in the database.
     * 
     * Trainers and Admins can provide a targetUserId to view a specific trainee's progress.
     * @param {number} exerciseId - The ID of the exercise to analyze.
     * @param {string|null} targetUserId - Optional UUID of a trainee.
     * @returns {Promise<Array>} List of performance data points with trends.
     */
    getPersonalHistory: async (exerciseId, targetUserId = null) => {
        const params = targetUserId ? { target_user_id: targetUserId } : {};
        // Maintained trailing slash to align with FastAPI router definition
        const response = await api.get(`/stats/personal/${exerciseId}/`, { params });
        return response.data;
    },

    /**
     * Fetches group-wide rankings based on coach-defined dashboard settings.
     * Calculations are performed in real-time using the Pandas-powered statistics engine.
     * @param {string} startDate - The beginning of the timeframe (ISO format).
     * @param {string} endDate - The end of the timeframe (ISO format).
     * @returns {Promise<Array>} List of leaderboard objects for the group.
     */
    getGroupLeaderboard: async (startDate, endDate) => {
        const params = {
            start_date: startDate,
            end_date: endDate
        };
        // Trailing slash maintained for backend consistency
        const response = await api.get('/stats/group-leaderboard/', { params });
        return response.data;
    }
};

export default statsEngineService;