import * as request from '../utils/request';

export const productdetail = async (productId) => {
    try {
        const res = await request.get(`products/${productId}/product-detail`);
        return res;
    } catch (error) {
        console.log('Error:', error);
    }
};
