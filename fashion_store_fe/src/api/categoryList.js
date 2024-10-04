import * as request from '../utils/request';

export const category = async (page) => {
    try {
        const res = await request.get(`categories/?page=${page}`);
        return res;
    } catch (error) {
        console.log('Error:', error);
    }
};
