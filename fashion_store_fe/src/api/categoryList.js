import * as request from '../utils/request';

export const category = async (page) => {
    try {
        const res = await request.get(`categories/`);
        return res;
    } catch (error) {
        console.log('Error:', error);
    }
};
