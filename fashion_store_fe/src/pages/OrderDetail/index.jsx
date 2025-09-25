import Breadcrumb from '~/components/Breadcrumb';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './OrderDetail.module.scss';
import React from 'react';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

const cx = classNames.bind(styles);

function OrderDetail() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/orders/order-detail/${orderId}`);
                const data = await response.json();
                setOrder(data);
            } catch (error) {
                console.error('Error fetching order details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!order) {
        return <div>Order not found</div>;
    }

    // Additional safety checks for order data
    if (!order.id) {
        return <div>Invalid order data</div>;
    }

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Decode Cloudinary URL
    const decodeCloudinaryUrl = (url) => {
        if (!url) return '';
        try {
            // Decode URL-encoded string
            const decodedUrl = decodeURIComponent(url);
            // Remove any remaining encoding and replace %3A with :
            return decodedUrl.replace(/%3A/g, ':').replace(/%2F/g, '/').replace(/%2C/g, ',');
        } catch (error) {
            console.error('Error decoding URL:', error);
            return url;
        }
    };

    return (
        <div className={cx('wrapper')}>
            <Breadcrumb>
                <Link to="/account">Order</Link>
                <span>Order Details</span>
            </Breadcrumb>

            <div className={cx('container')}>
                <div className={cx('header')}>
                    <div className={cx('order-info')}>
                        <h2>Order #{order.id}</h2>
                        <span className={cx('status', (order.status || 'unknown').toLowerCase())}>
                            {order.status || 'Unknown Status'}
                        </span>
                    </div>
                    <button className={cx('buy-again')}>ReOrder</button>
                </div>

                <div className={cx('delivery-time')}>
                    <span>Created at: {order.created_at ? formatDate(order.created_at) : 'N/A'}</span>
                </div>

                <div className={cx('info-grid')}>
                    <div className={cx('info-section')}>
                        <h3>Delivery Information</h3>
                        <div className={cx('info-content')}>
                            <p>
                                {order.customer?.first_name || 'N/A'} {order.customer?.last_name || 'N/A'}
                            </p>
                            <p>{order.customer?.email || 'N/A'}</p>
                            <p>{order.customer?.phone || 'Not updated yet'}</p>
                        </div>
                    </div>

                    <div className={cx('info-section')}>
                        <h3>Payment Method</h3>
                        <div className={cx('info-content')}>
                            <p>{order.payment_method || 'N/A'}</p>
                            <p>Payment Status: {order.payment_status || 'N/A'}</p>
                        </div>
                    </div>

                    <div className={cx('info-section')}>
                        <h3>Shipping Information</h3>
                        <div className={cx('info-content')}>
                            <div className={cx('order-item', 'order-address')}>
                                <p>{order.shipping_address_details?.full_name || 'N/A'}</p>
                                <p>{order.shipping_address_details?.phone || 'N/A'}</p>
                                <p>{order.shipping_address_details?.full_address || 'No shipping address'}</p>
                                {order.shipping_address_details?.note && (
                                    <div className={cx('address-details')}>
                                        <p>
                                            <strong>Note:</strong> {order.shipping_address_details.note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cx('order-timeline')}>
                    <div className={cx('timeline-item', 'active')}>
                        <span className={cx('dot')}></span>
                        <span>Order Placed</span>
                        <span className={cx('time')}>{order.created_at ? formatDate(order.created_at) : 'N/A'}</span>
                    </div>
                    <div className={cx('timeline-item', { active: order.status !== 'Processing' })}>
                        <span className={cx('dot')}></span>
                        <span>{order.status || 'Unknown'}</span>
                        <span className={cx('time')}>{order.updated_at ? formatDate(order.updated_at) : 'N/A'}</span>
                    </div>
                </div>

                <div className={cx('products-section')}>
                    <h3>Info Cart</h3>
                    <div className={cx('products-list')}>
                        {order.order_details && order.order_details.length > 0 ? (
                            order.order_details.map((item) => (
                                <div key={item.id} className={cx('product-item')}>
                                    {item.image && (
                                        <img
                                            src={decodeCloudinaryUrl(item.image)}
                                            alt={item.product_name || 'Product'}
                                            className={cx('product-image')}
                                        />
                                    )}
                                    <div className={cx('product-details')}>
                                        <div className={cx('product-info')}>
                                            <h4 className={cx('product-name')}>
                                                {item.product_name || 'Unknown Product'}
                                            </h4>
                                            <p className={cx('product-quantity')}> x{item.quantity || 0}</p>
                                        </div>
                                        <span className={cx('price')}>
                                            ${parseFloat(item.unit_price * item.quantity || 0).toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No items found in this order</p>
                        )}
                    </div>

                    <div className={cx('order-summary')}>
                        <div className={cx('summary-row')}>
                            <span>Original Price</span>
                            <span>${parseFloat(order.original_amount || 0).toFixed(0)}</span>
                        </div>
                        <div className={cx('summary-row')}>
                            <span>Discount Price ({order.coupon_code})</span>
                            <span>${parseFloat(order.discount_amount || 0).toFixed(0)}</span>
                        </div>
                        <div className={cx('summary-row')}>
                            <span>Subtotal</span>
                            <span>${parseFloat(order.total_amount || 0).toFixed(0)}</span>
                        </div>
                        <div className={cx('summary-row')}>
                            <span>Shipping Fee</span>
                            <span>0</span>
                        </div>
                        <div className={cx('summary-row', 'total')}>
                            <span>Total</span>
                            <span>${parseFloat(order.total_amount || 0).toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;
