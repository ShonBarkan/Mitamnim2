import api from './api';

const statsEngineService = {
    /**
     * Fetches personal performance trends for a specific exercise.
     * Coaches can optionally pass a targetUserId to view a trainee's data.
     */
    getPersonalHistory: async (exerciseId, targetUserId = null) => {
        const params = targetUserId ? { target_user_id: targetUserId } : {};
        const response = await api.get(`/stats/personal/${exerciseId}/`, { params });
        return response.data;
    },

    /**
     * Fetches group-wide rankings based on coach-defined dashboard settings.
     * Requires a date range (startDate and endDate).
     */
    getGroupLeaderboard: async (startDate, endDate) => {
        const params = {
            start_date: startDate, // Expected format: ISO string or YYYY-MM-DD
            end_date: endDate
        };
        const response = await api.get('/stats/group-leaderboard/', { params });
        return response.data;
    }
};

export default statsEngineService;