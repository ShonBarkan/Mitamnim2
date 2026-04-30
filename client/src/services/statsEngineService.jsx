import api from './api';

/**
 * Service for interacting with the Statistics Engine.
 * Handles performance history, group-wide leaderboard data, and consolidated user overviews.
 */
const statsEngineService = {
    /**
     * Fetches a high-level consolidated overview for the user dashboard.
     * Includes total workouts, duration, relative ranking, day distribution, 
     * PR hall of fame, and velocity of progress.
     * 
     * @param {string|null} targetUserId - Optional UUID of a trainee (for Trainers/Admins).
     * @returns {Promise<Object>} Object containing UserOverviewStats.
     */
    getUserOverview: async (targetUserId = null) => {
        const params = targetUserId ? { target_user_id: targetUserId } : {};
        // Maintained trailing slash to align with FastAPI router definition
        const response = await api.get('/stats/overview/', { params });
        return response.data;
    },

    /**
     * Fetches personal performance trends for a specific exercise.
     * Aggregates data across the exercise hierarchy and applies parameter-specific 
     * aggregation strategies (Sum, Max, Avg, etc.) defined in the database.
     * 
     * @param {number} exerciseId - The ID of the exercise to analyze.
     * @param {string|null} targetUserId - Optional UUID of a trainee.
     * @returns {Promise<Array>} List of performance data points with trends.
     */
    getPersonalHistory: async (exerciseId, targetUserId = null) => {
        const params = targetUserId ? { target_user_id: targetUserId } : {};
        const response = await api.get(`/stats/personal/${exerciseId}/`, { params });
        return response.data;
    },

    /**
     * Fetches group-wide rankings based on coach-defined dashboard settings.
     * Calculations are performed in real-time using the Pandas-powered statistics engine.
     * 
     * @param {string} startDate - The beginning of the timeframe (ISO format).
     * @param {string} endDate - The end of the timeframe (ISO format).
     * @returns {Promise<Array>} List of leaderboard objects for the group.
     */
    getGroupLeaderboard: async (startDate, endDate) => {
        const params = {
            start_date: startDate,
            end_date: endDate
        };
        const response = await api.get('/stats/group-leaderboard/', { params });
        return response.data;
    }
};

export default statsEngineService;