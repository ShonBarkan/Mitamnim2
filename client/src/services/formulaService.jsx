import api from './api';

const formulaService = {
    getFormulas: async () => {
        const response = await api.get('/parameter-formulas/');
        return response.data;
    },

    createFormula: async (data) => {
        const response = await api.post('/parameter-formulas/', data);
        return response.data;
    }
};

export default formulaService;