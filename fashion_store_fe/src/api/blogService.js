import * as request from '../utils/request';

// Fetch latest blog posts with optional parameters
export const getLatestBlogs = async (limit = 4) => {
    try {
        const url = `news/?page=1&ordering=-published_at`;
        const res = await request.get(url);

        if (!res || !res.results) {
            throw new Error('Invalid response format');
        }

        // Return only the requested number of blog posts
        return {
            ...res,
            results: res.results.slice(0, limit)
        };
    } catch (error) {
        console.error('Error fetching latest blogs:', error);
        throw error;
    }
};

// Fetch all blogs with pagination
export const getAllBlogs = async (page = 1) => {
    try {
        const url = `news/?page=${page}&ordering=-published_at`;
        const res = await request.get(url);

        if (!res || !res.results) {
            throw new Error('Invalid response format');
        }

        return res;
    } catch (error) {
        console.error('Error fetching all blogs:', error);
        throw error;
    }
};