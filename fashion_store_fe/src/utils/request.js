import axios from 'axios';

// Khởi tạo instance axios với base URL
const request = axios.create({
    baseURL: 'http://127.0.0.1:8000/',
});

// Hàm tạo một instance axios với token xác thực
export const authApi = (token) => {
    return axios.create({
        baseURL: 'http://127.0.0.1:8000/',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
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
        const response = await request.patch(path, data, option);
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
