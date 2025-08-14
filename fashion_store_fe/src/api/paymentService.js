import { post } from '~/utils/request';

// Service để xác nhận thanh toán PayPal
export const confirmPaypalPayment = async (paymentId, payerId) => {
    try {
        const response = await post('/orders/execute-paypal-payment/', {
            payment_id: paymentId,
            payer_id: payerId
        });
        return response;
    } catch (error) {
        console.error('Payment confirmation error:', error);
        throw error;
    }
};

// Service để lấy thông tin đơn hàng theo payment ID
export const getOrderByPaymentId = async (paymentId) => {
    try {
        const response = await post('/orders/get-by-payment-id/', {
            payment_id: paymentId
        });
        return response;
    } catch (error) {
        console.error('Get order by payment ID error:', error);
        throw error;
    }
}; 