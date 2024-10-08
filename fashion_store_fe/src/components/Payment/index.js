// Payment.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi } from '~/utils/request';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Payment = () => {
    const location = useLocation();
    const { orderId, totalAmount } = location.state; // Nhận thông tin từ trang checkout
    const [loading, setLoading] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        try {
            const response = await authApi(localStorage.getItem('access_token')).post('/orders/checkout/', {
                order_id: orderId,
                total_amount: totalAmount,
                payment_method: 'VNPay', // Hoặc phương thức thanh toán khác
            });

            if (response.data.payment_url) {
                setPaymentUrl(response.data.payment_url);
                // Chuyển hướng đến URL thanh toán
                window.location.href = response.data.payment_url;
            } else {
                toast.error('Có lỗi xảy ra, vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Lỗi thanh toán:', error);
            toast.error('Lỗi thanh toán, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handlePayment();
    }, []);

    return (
        <div>
            <ToastContainer />
            <h2>Thanh Toán</h2>
            {loading ? (
                <p>Đang xử lý thanh toán...</p>
            ) : (
                <p>
                    Nếu không tự động chuyển hướng, vui lòng nhấn vào <a href={paymentUrl}>{paymentUrl}</a>.
                </p>
            )}
        </div>
    );
};

export default Payment;
