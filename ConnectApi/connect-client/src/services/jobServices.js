import apiClient from './apiClient';

const API_BASE_URL = '/Jobs';

export const getAll = async (params) => {
    const response = await apiClient.get(API_BASE_URL, { params });
    return response.data;
};

export const getById = async (id) => {
    const response = await apiClient.get(`${API_BASE_URL}/${id}`);
    return response.data;
};

export const create = async (job) => {
    const response = await apiClient.post(API_BASE_URL, job);
    return response.data;
};

export const update = async (id, job) => {
    const response = await apiClient.put(`${API_BASE_URL}/${id}`, job);
    return response.data;
};

export const updateVerificationStatus = async (
    id,
    verificationStatus,
    adminId
) => {
    const response = await apiClient.put(
        `${API_BASE_URL}/${id}/verification`,
        {
            verificationStatus,
            adminId
        }
    );
    return response.data;
};

export const remove = async (id, userId) => {
    const response = await apiClient.delete(`${API_BASE_URL}/${id}?userId=${userId}`);
    return response.data;
};
