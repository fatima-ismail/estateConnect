import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api'
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('estate_access_token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('estate_access_token');
            window.dispatchEvent(new Event('estate-auth-expired'));
        }

        return Promise.reject(error);
    }
);

export default apiClient;
