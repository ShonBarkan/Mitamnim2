import api from './api';

/**
 * Service handling the API communication for the stats dashboard configurations.
 * Manages how exercises and parameters are displayed on the public leaderboard.
 * Ensures consistent endpoint routing with trailing slashes.
 */
const dashboardConfigService = {
    /**
     * Retrieves all dashboard configurations for the current group.
     * @returns {Promise<Array>} List of configuration objects sorted by display_order.
     */
    getConfigs: async () => {
        const response = await api.get('/dashboard-config/');
        return response.data;
    },

    /**
     * Adds a new item to the group dashboard.
     * @param {Object} data - Contains exercise_id, parameter_id, ranking_direction, and visibility settings.
     * @returns {Promise<Object>} The created configuration object.
     */
    createConfig: async (data) => {
        const response = await api.post('/dashboard-config/', data);
        return response.data;
    },

    /**
     * Updates an existing configuration entry.
     * Primarily used for drag-and-drop reordering (display_order) or inline status toggles.
     * Supports partial updates via PATCH.
     * @param {number} id - The ID of the configuration entry.
     * @param {Object} data - The partial data to update.
     * @returns {Promise<Object>} The updated configuration object.
     */
    updateConfig: async (id, data) => {
        const response = await api.patch(`/dashboard-config/${id}/`, data);
        return response.data;
    },

    /**
     * Removes an item from the dashboard configuration.
     * @param {number} id - The ID of the configuration entry to delete.
     * @returns {Promise<void>}
     */
    removeConfig: async (id) => {
        await api.delete(`/dashboard-config/${id}/`);
    }
};

export default dashboardConfigService;