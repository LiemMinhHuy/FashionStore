import axios from 'axios';
import { refreshToken } from '../api/loginService';

// Khởi tạo instance axios với base URL
const request = axios.create({
    baseURL: 'http://127.0.0.1:8000/',
});

// Hàm tạo một instance axios với token xác thực
export const authApi = (token) => {
    const instance = axios.create({
        baseURL: 'http://127.0.0.1:8000/',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    // Add request interceptor to check token expiration
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Add response interceptor to handle token refresh
    instance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    const newTokenData = await refreshToken();
                    const newAccessToken = newTokenData.access_token;
                    
                    // Update the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    
                    // Retry the original request
                    return instance(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, redirect to login
                    console.error('Token refresh failed:', refreshError);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_data');
                    window.location.href = '/';
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

// Create a singleton instance for authenticated requests
let authApiInstance = null;

export const getAuthApi = () => {
    if (!authApiInstance) {
        const token = localStorage.getItem('access_token');
        authApiInstance = authApi(token);
    }
    return authApiInstance;
};

// Reset the singleton when logging out
export const resetAuthApi = () => {
    authApiInstance = null;
};

// Xử lý GET request
export const get = async (path, option = {}) => {
    try {
        const response = await request.get(path, option);
        return response.data;
    } catch (error) {
        console.error('GET request error:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

// Xử lý POST request
export const post = async (path, data, option = {}) => {
    try {
        const response = await request.post(path, data, option);
        return response.data;
    } catch (error) {
        console.error('POST request error:', error);
        throw error;
    }
};

// Xử lý PUT request
export const put = async (path, data, option = {}) => {
    try {
        const response = await request.put(path, data, option);
        return response.data;
    } catch (error) {
        console.error('PUT request error:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

// Xử lý PATCH request
export const patch = async (path, data, option = {}) => {
    try {
        const response = await authApi().patch(path, data, option); // Sử dụng authApi
        return response.data;
    } catch (error) {
        console.error('PATCH request error:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

// Xử lý DELETE request
export const del = async (path, option = {}) => {
    try {
        const response = await request.delete(path, option);
        return response.data;
    } catch (error) {
        console.error('DELETE request error:', error);
        throw error; // Ném lỗi để xử lý ở nơi gọi
    }
};

export default request;
