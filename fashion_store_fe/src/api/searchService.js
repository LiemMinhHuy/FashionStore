import * as request from '../utils/request';

export const search = async (q, page = 1) => {
    try {
        const res = await request.get(`products/?q=${q}&page=${page}`);
        console.log('Raw API Response:', res); // Kiểm tra phản hồi API gốc
        return res; // Trả về phản hồi API toàn bộ
    } catch (error) {
        console.log('Error:', error);
    }
};
