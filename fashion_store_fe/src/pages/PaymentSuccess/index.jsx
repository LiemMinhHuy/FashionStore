import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, HomeIcon, ShoppingBagIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames/bind';
import styles from './PaymentSuccess.module.scss';
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
                // Get information from URL params
                const urlParams = new URLSearchParams(window.location.search);
                const paymentId = urlParams.get('paymentId');
                const payerId = urlParams.get('PayerID');

                if (paymentId && payerId) {
                    // Confirm PayPal payment
                    await confirmPaypalPayment(paymentId, payerId);

                    // Get order information after confirmation
                    const orderResponse = await getOrderByPaymentId(paymentId);
                    setOrderData(orderResponse);

                    // Clear cart after successful payment
                    try {
                        await clearCart();
                    } catch (error) {
                        console.error('Error clearing cart:', error);
                    }
                } else if (location.state?.orderData) {
                    // If there's data from state navigation (other payment methods)
                    setOrderData(location.state.orderData);

                    // Clear cart after successful payment
                    try {
                        await clearCart();
                    } catch (error) {
                        console.error('Error clearing cart:', error);
                    }
                } else {
                    // If no payment params, try to get from other URL params
                    const orderId = urlParams.get('order_id');
                    if (orderId) {
                        setOrderData({ id: orderId });
                    } else {
                        // Redirect to payment failed page
                        navigate('/payment-failed', {
                            state: {
                                errorMessage: 'Payment information not found',
                                orderData: null,
                            },
                        });
                        return;
                    }
                }
            } catch (error) {
                console.error('Payment confirmation error:', error);
                // Redirect to payment failed page
                navigate('/payment-failed', {
                    state: {
                        errorMessage: error.response?.data?.error || 'An error occurred while confirming payment',
                        orderData: null,
                    },
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
                        <p>Confirming payment...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If no orderData, may have been redirected or there's an error
    if (!orderData) {
        return null;
    }

    return (
        <div className={cx('success-container')}>
            <div className={cx('success-card')}>
                {/* Header with success icon */}
                <div className={cx('success-header')}>
                    <div className={cx('success-icon-container')}>
                        <CheckCircleIcon className={cx('success-icon')} />
                    </div>
                    <h1 className={cx('success-title')}>Payment Successful!</h1>
                    <p className={cx('success-subtitle')}>
                        Thank you for your purchase. Your order has been confirmed and is being processed.
                    </p>
                </div>

                {/* Payment Details */}
                {orderData && (
                    <div className={cx('payment-details')}>
                        <h2 className={cx('payment-detail-title')}>Payment Details</h2>
                        <div className={cx('payment-detail-list')}>
                            <div className={cx('payment-detail-item')}>
                                <span className={cx('payment-detail-label')}>Transaction ID:</span>
                                <span className={cx('payment-detail-value')}>{orderData.id}</span>
                            </div>
                            <div className={cx('payment-detail-item')}>
                                <span className={cx('payment-detail-label')}>Date:</span>
                                <span className={cx('payment-detail-value')}>{new Date(orderData.created_at).toLocaleDateString('en-US')}</span>
                            </div>
                            <div className={cx('payment-detail-item')}>
                                <span className={cx('payment-detail-label')}>Payment Method:</span>
                                <span className={cx('payment-detail-value')}>{orderData.payment_method}</span>
                            </div>
                            <div className={cx('payment-detail-item')}>
                                <span className={cx('payment-detail-label')}>Total Amount:</span>
                                <span className={cx('payment-detail-value', 'total')}>${parseFloat(orderData.total_amount).toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className={cx('action-buttons')}>
                    <button className={cx('btn', 'btn-primary')} onClick={handleContinueShopping}>
                        <HomeIcon className={cx('btn-icon')} />
                        Continue Shopping
                    </button>
                    <button className={cx('btn', 'btn-secondary')} onClick={handleViewOrders}>
                        <ShoppingBagIcon className={cx('btn-icon')} />
                        View All Orders
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
