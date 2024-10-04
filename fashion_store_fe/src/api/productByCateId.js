import * as request from '../utils/request';

export const product = async (categoryId, page = 1) => {
    try {
        const res = await request.get(`products/category/${categoryId}/?page=${page}`);

        // Kiểm tra định dạng phản hồi
        if (!res || !res.results) {
            throw new Error('Invalid response format');
        }

        return res;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};
