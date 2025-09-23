import * as request from '../utils/request';

// Fetch all products with optional parameters
export const getAllProducts = async (page = 1, sortOption = 'latest', searchQuery = '') => {
    try {
        let url = `products/?page=${page}`;

        // Add search query if provided
        if (searchQuery) {
            url += `&q=${encodeURIComponent(searchQuery)}`;
        }

        // Add sort option if not default
        if (sortOption !== 'latest') {
            url += `&sort_option=${sortOption}&sortOption=${sortOption}`;
        }

        const res = await request.get(url);

        // Check response format
        if (!res || !res.results) {
            throw new Error('Invalid response format');
        }

        return res;
    } catch (error) {
        console.error('Error fetching all products:', error);
        throw error;
    }
};

// Fetch latest products (limited quantity)
export const getLatestProducts = async (limit = 4) => {
    try {
        const url = `products/?page=1&sort_option=latest`;
        const res = await request.get(url);

        if (!res || !res.results) {
            throw new Error('Invalid response format');
        }

        // Return only the requested number of products
        return {
            ...res,
            results: res.results.slice(0, limit)
        };
    } catch (error) {
        console.error('Error fetching latest products:', error);
        throw error;
    }
};

export const getProductsByCategory = async (categoryId, page = 1, sortOption = 'latest') => {
    try {
        let url = `products/category/${categoryId}/?page=${page}`;

        if (sortOption !== 'latest') {
            url += `&sort_option=${sortOption}&sortOption=${sortOption}`;
        }

        const res = await request.get(url);

        if (!res || !res.results) {
            throw new Error('Invalid response format');
        }

        return res;
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw error;
    }
};