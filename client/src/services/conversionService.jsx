import api from './api';

const conversionService = {
    getConversions: async () => {
        const response = await api.get('/parameter-conversions/');
        return response.data;
    },

    createConversion: async (data) => {
        const response = await api.get('/parameter-conversions/', data);
        return response.data;
    },

    deleteConversion: async (id) => {
        await api.delete(`/parameter-conversions/${id}/`);
    }
};

export default conversionService;