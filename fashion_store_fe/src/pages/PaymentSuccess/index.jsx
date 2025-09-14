import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, HomeIcon, ShoppingBagIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames/bind';
import styles from './PaymentSuccess.module.scss';
import OrderConfirmation from '~/components/OrderConfirmation';
import { confirmPaypalPayment, getOrderByPaymentId } from '~/api/paymentService';
import { CartContext } from '~/utils/Context/cartContext';

const cx = classNames.bind(styles);

const PaymentSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useContext(CartContext);
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        const handlePaymentConfirmation = async () => {
            try {
                // Lấy thông tin từ URL params
                const urlParams = new URLSearchParams(window.location.search);
                const paymentId = urlParams.get('paymentId');
                const payerId = urlParams.get('PayerID');

                if (paymentId && payerId) {
                    // Xác nhận thanh toán PayPal
                    await confirmPaypalPayment(paymentId, payerId);
                    
                    // Lấy thông tin đơn hàng sau khi xác nhận
                    const orderResponse = await getOrderByPaymentId(paymentId);
                    setOrderData(orderResponse);
                    
                    // Clear cart sau khi thanh toán thành công
                    try {
                        await clearCart();
                    } catch (error) {
                        console.error('Error clearing cart:', error);
                    }
                } else if (location.state?.orderData) {
                    // Nếu có dữ liệu từ state navigation (các phương thức thanh toán khác)
                    setOrderData(location.state.orderData);
                    
                    // Clear cart sau khi thanh toán thành công
                    try {
                        await clearCart();
                    } catch (error) {
                        console.error('Error clearing cart:', error);
                    }
                } else {
                    // Nếu không có payment params, có thể lấy từ URL params khác
                    const orderId = urlParams.get('order_id');
                    if (orderId) {
                        setOrderData({ id: orderId });
                    } else {
                        // Chuyển hướng đến trang thanh toán thất bại
                        navigate('/payment-failed', {
                            state: {
                                errorMessage: 'Không tìm thấy thông tin thanh toán',
                                orderData: null
                            }
                        });
                        return;
                    }
                }
            } catch (error) {
                console.error('Payment confirmation error:', error);
                // Chuyển hướng đến trang thanh toán thất bại
                navigate('/payment-failed', {
                    state: {
                        errorMessage: error.response?.data?.error || 'Có lỗi xảy ra khi xác nhận thanh toán',
                        orderData: null
                    }
                });
                return;
            } finally {
                setLoading(false);
            }
        };

        handlePaymentConfirmation();
    }, [location, navigate]);

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/order');
    };

    const handleViewOrderDetails = () => {
        navigate('/order', { state: { orderData } });
    };

    if (loading) {
        return (
            <div className={cx('success-container')}>
                <div className={cx('success-card')}>
                    <div className={cx('loading-container')}>
                        <div className={cx('loading-spinner')}></div>
                        <p>Đang xác nhận thanh toán...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Nếu không có orderData, có thể đã chuyển hướng hoặc có lỗi
    if (!orderData) {
        return null;
    }



    return (
        <div className={cx('success-container')}>
            <div className={cx('success-card')}>
                {/* Header với icon thành công */}
                <div className={cx('success-header')}>
                    <div className={cx('success-icon-container')}>
                        <CheckCircleIcon className={cx('success-icon')} />
                    </div>
                    <h1 className={cx('success-title')}>Thanh toán thành công!</h1>
                    <p className={cx('success-subtitle')}>
                        Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
                    </p>
                </div>

                {/* Thông tin đơn hàng */}
                {orderData && <OrderConfirmation orderData={orderData} />}

                {/* Thông tin bổ sung */}
                <div className={cx('additional-info')}>
                    <div className={cx('info-item')}>
                        <DocumentTextIcon className={cx('info-icon')} />
                        <div className={cx('info-content')}>
                            <h3>Xác nhận đơn hàng</h3>
                            <p>Bạn sẽ nhận được email xác nhận với chi tiết đơn hàng trong thời gian ngắn.</p>
                        </div>
                    </div>
                    <div className={cx('info-item')}>
                        <ShoppingBagIcon className={cx('info-icon')} />
                        <div className={cx('info-content')}>
                            <h3>Thông tin vận chuyển</h3>
                            <p>Chúng tôi sẽ thông báo khi đơn hàng được gửi và cung cấp thông tin theo dõi.</p>
                        </div>
                    </div>
                </div>

                {/* Các nút hành động */}
                <div className={cx('action-buttons')}>
                    <button className={cx('btn', 'btn-primary')} onClick={handleContinueShopping}>
                        <HomeIcon className={cx('btn-icon')} />
                        Tiếp tục mua sắm
                    </button>
                    <button className={cx('btn', 'btn-secondary')} onClick={handleViewOrders}>
                        <ShoppingBagIcon className={cx('btn-icon')} />
                        Xem tất cả đơn hàng
                    </button>
                    {orderData && (
                        <button className={cx('btn', 'btn-outline')} onClick={handleViewOrderDetails}>
                            <DocumentTextIcon className={cx('btn-icon')} />
                            Xem chi tiết đơn hàng
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
