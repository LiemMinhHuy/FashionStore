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
            // Store both access and refresh tokens
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            return response.data;
        } else {
            throw new Error('No access token returned');
        }
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

// Function to refresh access token using refresh token
export const refreshToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/o/token/`, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.data && response.data.access_token) {
            // Update stored tokens
            localStorage.setItem('access_token', response.data.access_token);
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            return response.data;
        } else {
            throw new Error('No access token returned from refresh');
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        // Clear tokens if refresh fails
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw error;
    }
};

// Function to logout and clear tokens
export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
};
