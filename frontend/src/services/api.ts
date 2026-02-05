// src/services/api.ts

import axios from 'axios';

const api = axios.create({
    // Use relative URL - Vite proxy will forward /api requests to Django backend
    // This makes cookies work because requests go through the same origin
    baseURL: '/api',
    // Include cookies in requests (required for httpOnly JWT cookies)
    withCredentials: true,
})

export default api;