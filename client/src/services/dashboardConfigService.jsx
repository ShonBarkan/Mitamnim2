import api from './api';

const dashboardConfigService = {
    getConfigs: async () => {
        const response = await api.get('/dashboard-config/');
        return response.data;
    },

    createConfig: async (data) => {
        const response = await api.post('/dashboard-config/', data);
        return response.data;
    },

    /**
     * Updates an existing configuration.
     * Used for reordering (display_order) or toggling visibility.
     */
    updateConfig: async (id, data) => {
        const response = await api.patch(`/dashboard-config/${id}/`, data);
        return response.data;
    },

    removeConfig: async (id) => {
        await api.delete(`/dashboard-config/${id}/`);
    }
};

export default dashboardConfigService;