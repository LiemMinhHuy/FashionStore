import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login/`, {
            username,
            password,
        });

        // Kiểm tra nếu API trả về dữ liệu hợp lệ
        if (response.data && response.data.access_token) {
            return response.data;
        } else {
            throw new Error('No access token returned');
        }
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};
