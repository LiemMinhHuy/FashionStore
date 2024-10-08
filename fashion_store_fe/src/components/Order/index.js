import React, { useEffect, useState, useContext } from 'react';
import { authApi } from '~/utils/request';
import { CartContext } from '~/utils/Context/cartContext';
import styles from './Order.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const Order = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(CartContext);
    const [currentStatus, setCurrentStatus] = useState('Pending'); // Trạng thái mặc định
    const [expandedOrders, setExpandedOrders] = useState([]); // Danh sách đơn hàng mở rộng

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await authApi(localStorage.getItem('access_token')).get('/orders/');
                // Kiểm tra nếu response.data có thuộc tính results
                if (response.data && Array.isArray(response.data.results)) {
                    setOrders(response.data.results);
                } else {
                    setError('Invalid data format');
                }
            } catch (error) {
                setError('Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Danh sách các payment_status duy nhất để tạo các tab
    const paymentStatuses = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded', 'Paid'];

    // Lọc đơn hàng theo trạng thái hiện tại
    const filteredOrders = orders.filter((order) => order.payment_status === currentStatus);

    const toggleOrderDetails = (orderId) => {
        setExpandedOrders((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
        );
    };

    if (loading) return <div className={cx('loading')}>Loading...</div>;
    if (error) return <div className={cx('error')}>{error}</div>;

    return (
        <div className={cx('order-list-container')}>
            <h2 className={cx('title')}>My Orders</h2>

            {/* Thanh điều hướng ngang cho các payment_status */}
            <div className={cx('status-tabs')}>
                {paymentStatuses.map((status) => (
                    <button
                        key={status}
                        className={cx('status-tab', { active: status === currentStatus })}
                        onClick={() => setCurrentStatus(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Danh sách đơn hàng theo payment_status hiện tại */}
            <div className={cx('orders')}>
                {filteredOrders.length === 0 ? (
                    <p>Không có đơn hàng nào trong trạng thái "{currentStatus}".</p>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className={cx('order-item')}>
                            <p>
                                <strong>Order ID:</strong> {order.id}
                            </p>
                            <p>
                                <strong>Total:</strong> ${parseFloat(order.total_amount).toFixed(2)}
                            </p>
                            <p>
                                <strong>Shipping Address:</strong> {order.shipping_address}
                            </p>
                            <p>
                                <strong>Payment Method:</strong> {order.payment_method}
                            </p>
                            <p>
                                <strong>Payment Status:</strong> {order.payment_status}
                            </p>

                            {/* Nút để mở rộng/thu gọn chi tiết đơn hàng */}
                            <button className={cx('details-button')} onClick={() => toggleOrderDetails(order.id)}>
                                {expandedOrders.includes(order.id) ? 'Ẩn Chi tiết' : 'Chi tiết'}
                            </button>

                            {/* Hiển thị chi tiết đơn hàng nếu được mở rộng */}
                            {expandedOrders.includes(order.id) &&
                                order.order_details &&
                                order.order_details.length > 0 && (
                                    <div className={cx('order-details')}>
                                        <h4>Order Details:</h4>
                                        {order.order_details.map((detail) => (
                                            <div key={detail.id} className={cx('order-detail-item')}>
                                                <p>
                                                    <strong>Product Name:</strong>{' '}
                                                    {detail.product_name || `ID: ${detail.product.id}`}
                                                </p>
                                                <p>
                                                    <strong>Quantity:</strong> {detail.quantity}
                                                </p>
                                                <p>
                                                    <strong>Unit Price:</strong> $
                                                    {parseFloat(detail.unit_price).toFixed(2)}
                                                </p>
                                                <p>
                                                    <strong>Total Price:</strong> $
                                                    {parseFloat(detail.totalPrice).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            <hr />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Order;
