import * as request from '../utils/request';

export const search = async (q, page = 1) => {
    try {
        const res = await request.get(`products/?q=${q}&page=${page}`);
        return res;
    } catch (error) {
        console.log('Error:', error);
    }
};
