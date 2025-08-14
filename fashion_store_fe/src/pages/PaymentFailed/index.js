import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { XCircleIcon, HomeIcon, ShoppingBagIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames/bind';
import styles from './PaymentFailed.module.scss';

const cx = classNames.bind(styles);

const PaymentFailed = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('Payment was unsuccessful. Please try again.');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Lấy thông tin lỗi từ state navigation hoặc URL params
        if (location.state?.errorMessage) {
            setErrorMessage(location.state.errorMessage);
        }
        if (location.state?.orderData) {
            setOrderData(location.state.orderData);
        }
        
        // Lấy thông tin từ URL params
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const orderId = urlParams.get('order_id');
        
        if (error) {
            setErrorMessage(decodeURIComponent(error));
        }
        if (orderId) {
            setOrderData({ id: orderId });
        }
        
        setLoading(false);
    }, [location]);

    const handleTryAgain = () => {
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleViewOrders = () => {
        navigate('/order');
    };

    if (loading) {
        return (
            <div className={cx('loading-container')}>
                <div className={cx('loading-spinner')}></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className={cx('failed-container')}>
            <div className={cx('failed-card')}>
                {/* Header với icon thất bại */}
                <div className={cx('failed-header')}>
                    <div className={cx('failed-icon-container')}>
                        <XCircleIcon className={cx('failed-icon')} />
                    </div>
                    <h1 className={cx('failed-title')}>Payment Failed</h1>
                    <p className={cx('failed-subtitle')}>
                        {errorMessage}
                    </p>
                </div>

                {/* Thông tin đơn hàng nếu có */}
                {orderData && (
                    <div className={cx('order-info')}>
                        <h2 className={cx('order-info-title')}>Order Information</h2>
                        <div className={cx('order-details')}>
                            <div className={cx('order-detail-item')}>
                                <span className={cx('detail-label')}>Order ID:</span>
                                <span className={cx('detail-value')}>#{orderData.id}</span>
                            </div>
                            {orderData.total_amount && (
                                <div className={cx('order-detail-item')}>
                                    <span className={cx('detail-label')}>Total Amount:</span>
                                    <span className={cx('detail-value')}>
                                        {parseFloat(orderData.total_amount).toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Thông tin bổ sung */}
                <div className={cx('additional-info')}>
                    <div className={cx('info-item')}>
                        <ArrowPathIcon className={cx('info-icon')} />
                        <div className={cx('info-content')}>
                            <h3>Try Again</h3>
                            <p>You can try the payment again or choose a different payment method.</p>
                        </div>
                    </div>
                    <div className={cx('info-item')}>
                        <ShoppingBagIcon className={cx('info-icon')} />
                        <div className={cx('info-content')}>
                            <h3>Contact Support</h3>
                            <p>If you continue to experience issues, please contact our customer support.</p>
                        </div>
                    </div>
                </div>

                {/* Các nút hành động */}
                <div className={cx('action-buttons')}>
                    <button 
                        className={cx('btn', 'btn-primary')} 
                        onClick={handleTryAgain}
                    >
                        <ArrowPathIcon className={cx('btn-icon')} />
                        Try Again
                    </button>
                    <button 
                        className={cx('btn', 'btn-secondary')} 
                        onClick={handleContinueShopping}
                    >
                        <HomeIcon className={cx('btn-icon')} />
                        Continue Shopping
                    </button>
                    <button 
                        className={cx('btn', 'btn-outline')} 
                        onClick={handleViewOrders}
                    >
                        <ShoppingBagIcon className={cx('btn-icon')} />
                        View Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed; 