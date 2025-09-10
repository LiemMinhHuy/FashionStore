import * as request from '../utils/request';

// Include sortOption as parameter:
export const product = async (categoryId, page = 1, sortOption = 'latest') => {
    try {
        let url = `products/category/${categoryId}/?page=${page}`;

        //  Add sortOption to URL Query Parameter:
        if (sortOption !== 'latest') {
            // Send both snake_case and camelCase for maximum compatibility
            url += `&sort_option=${sortOption}&sortOption=${sortOption}`;
        }

        const res = await request.get(url);

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
