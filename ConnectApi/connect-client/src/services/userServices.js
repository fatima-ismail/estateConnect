import apiClient from './apiClient';

const API_BASE_URL = '/Users';

export const getAll = async () => {
    const response = await apiClient.get(API_BASE_URL);
    return response.data;
};

export const getById = async (id) => {
    const response = await apiClient.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

export const getAdminContact = async () => {
    const response = await apiClient.get(`${API_BASE_URL}/admin-contact`);
    return response.data;
};

export const createSubAdmin = async (subAdmin) => {
    const response = await apiClient.post(`${API_BASE_URL}/subadmins`, subAdmin);
    return response.data;
};

export const update = async (id, user) => {
    const response = await apiClient.put(`${API_BASE_URL}/${id}`, user);
    return response.data;
};
export const changePassword = async (id, passwords) => {
    const response = await apiClient.put(`${API_BASE_URL}/${id}/password`, passwords);
    return response.data;
};
export const remove = async (id) => {
    const response = await apiClient.delete(`${API_BASE_URL}/${id}`);
    return response.data;
};
