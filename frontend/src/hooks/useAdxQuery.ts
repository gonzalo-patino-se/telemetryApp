import api from '../services/api';

export const useAdxQuery = () => {
    const runQuery = async (kql: string) => {
        const response = await api.post('/query_adx/', { kql });
        return response.data;
    };
    return { runQuery };
};