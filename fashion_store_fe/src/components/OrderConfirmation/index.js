import React from 'react';
import { CheckCircleIcon, TruckIcon, CreditCardIcon, MapPinIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames/bind';
import styles from './OrderConfirmation.module.scss';

const cx = classNames.bind(styles);

const OrderConfirmation = ({ orderData }) => {
    if (!orderData) return null;

    const formatCurrency = (amount) => {
        return parseFloat(amount).toLocaleString('vi-VN') + 'đ';
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'failed':
                return 'error';
            default:
                return 'info';
        }
    };

    return (
        <div className={cx('confirmation-container')}>
            <div className={cx('confirmation-header')}>
                <CheckCircleIcon className={cx('confirmation-icon')} />
                <h2>Order Confirmed</h2>
                <p>Your order has been successfully placed</p>
            </div>

            <div className={cx('order-summary')}>
                <div className={cx('summary-item')}>
                    <div className={cx('summary-icon')}>
                        <CreditCardIcon />
                    </div>
                    <div className={cx('summary-content')}>
                        <h3>Order ID</h3>
                        <p>#{orderData.id}</p>
                    </div>
                </div>

                {orderData.total_amount && (
                    <div className={cx('summary-item')}>
                        <div className={cx('summary-icon')}>
                            <CreditCardIcon />
                        </div>
                        <div className={cx('summary-content')}>
                            <h3>Total Amount</h3>
                            <p>{formatCurrency(orderData.total_amount)}</p>
                        </div>
                    </div>
                )}

                {orderData.payment_method && (
                    <div className={cx('summary-item')}>
                        <div className={cx('summary-icon')}>
                            <CreditCardIcon />
                        </div>
                        <div className={cx('summary-content')}>
                            <h3>Payment Method</h3>
                            <p>{orderData.payment_method}</p>
                        </div>
                    </div>
                )}

                {orderData.payment_status && (
                    <div className={cx('summary-item')}>
                        <div className={cx('summary-icon')}>
                            <CheckCircleIcon />
                        </div>
                        <div className={cx('summary-content')}>
                            <h3>Payment Status</h3>
                            <span className={cx('status-badge', `status-${getStatusColor(orderData.payment_status)}`)}>
                                {orderData.payment_status}
                            </span>
                        </div>
                    </div>
                )}

                {orderData.shipping_address && (
                    <div className={cx('summary-item')}>
                        <div className={cx('summary-icon')}>
                            <MapPinIcon />
                        </div>
                        <div className={cx('summary-content')}>
                            <h3>Shipping Address</h3>
                            <p>{orderData.shipping_address}</p>
                        </div>
                    </div>
                )}
            </div>

            {orderData.order_details && orderData.order_details.length > 0 && (
                <div className={cx('order-items')}>
                    <h3>Order Items</h3>
                    <div className={cx('items-list')}>
                        {orderData.order_details.map((item, index) => (
                            <div key={index} className={cx('item')}>
                                <div className={cx('item-info')}>
                                    <h4>{item.product_name || `Product ${item.product?.id}`}</h4>
                                    <p>Quantity: {item.quantity}</p>
                                    <p>Price: {formatCurrency(item.unit_price)}</p>
                                </div>
                                <div className={cx('item-total')}>
                                    {formatCurrency(item.unit_price * item.quantity)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={cx('next-steps')}>
                <h3>What's Next?</h3>
                <div className={cx('steps-list')}>
                    <div className={cx('step')}>
                        <div className={cx('step-icon')}>
                            <CheckCircleIcon />
                        </div>
                        <div className={cx('step-content')}>
                            <h4>Order Confirmed</h4>
                            <p>We've received your order and are processing it</p>
                        </div>
                    </div>
                    <div className={cx('step')}>
                        <div className={cx('step-icon')}>
                            <TruckIcon />
                        </div>
                        <div className={cx('step-content')}>
                            <h4>Shipping</h4>
                            <p>We'll notify you when your order ships</p>
                        </div>
                    </div>
                    <div className={cx('step')}>
                        <div className={cx('step-icon')}>
                            <MapPinIcon />
                        </div>
                        <div className={cx('step-content')}>
                            <h4>Delivery</h4>
                            <p>Your order will be delivered to your address</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation; 