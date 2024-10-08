import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '~/utils/Context/cartContext';
import styles from './CheckOut.module.scss';
import classNames from 'classnames/bind';
import { authApi } from '~/utils/request';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cx = classNames.bind(styles);

const CheckOut = () => {
    const { cartItems, clearCart } = useContext(CartContext);
    const [shippingAddress, setShippingAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const total = cartItems.reduce((sum, item) => {
        const price = parseFloat(item.product.price);
        return sum + item.quantity * (isNaN(price) ? 0 : price);
    }, 0);

    const handleCheckOut = async () => {
        if (!shippingAddress) {
            toast.error('Vui lòng nhập địa chỉ giao hàng');
            return;
        }

        const payload = {
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
            total_amount: total, // Thêm tổng số tiền vào payload
        };

        try {
            setLoading(true);
            const response = await authApi(localStorage.getItem('access_token')).post('/orders/checkout/', payload);

            if (response.status === 201 && response.data) {
                clearCart();
                navigate('/order', { state: { orderData: response.data } });
            } else {
                toast.error('Thanh toán thất bại, vui lòng thử lại');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Đã xảy ra lỗi, vui lòng thử lại sau');
        } finally {
            setLoading(false);
        }
    };

    const handleVNPayCheckOut = async () => {
        const payload = {
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
            total_amount: total, // Thêm tổng số tiền vào payload
        };

        try {
            setLoading(true);
            const response = await authApi(localStorage.getItem('access_token')).post('/orders/checkout/', payload);

            if (response.data.payment_url) {
                // Chuyển hướng đến URL thanh toán VNPay
                window.location.href = response.data.payment_url;
            } else {
                toast.error('Lỗi khi tạo thanh toán VNPay');
            }
        } catch (error) {
            console.error('Lỗi khi gọi API thanh toán VNPay:', error);
            toast.error('Lỗi khi gọi API thanh toán VNPay');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('checkout-container')}>
            <ToastContainer />
            <h2 className={cx('title')}>Checkout</h2>
            <div className={cx('checkout-wrapper')}>
                <div className={cx('cart-items')}>
                    {cartItems.map((item) => (
                        <div key={item.id} className={cx('cart-item')}>
                            <img
                                src={item.product.image.replace('/media/https%3A', 'https:/')}
                                className={cx('cart-image')}
                                alt={item.product.name}
                            />
                            <div className={cx('item-info')}>
                                <h4>{item.product.name}</h4>
                                <div className={cx('flex')}>
                                    <p>{parseFloat(item.product.price).toFixed(2)} VND</p>
                                    <p>{item.quantity}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <p className={cx('total')}>Total: {total.toFixed(2)} VND</p>
                </div>

                <div className={cx('checkout-text')}>
                    <div className={cx('form-group')}>
                        <label>Shipping Address</label>
                        <input
                            type="text"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            className={cx('input')}
                            placeholder="Enter your shipping address"
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label>Payment Method</label>
                        <div className={cx('payment-buttons')}>
                            <button
                                onClick={() => setPaymentMethod('Cash')}
                                className={cx('payment-btn', { active: paymentMethod === 'Cash' })}
                            >
                                Cash
                            </button>
                            <button
                                onClick={() => setPaymentMethod('VNPay')}
                                className={cx('payment-btn', { active: paymentMethod === 'VNPay' })}
                            >
                                VNPay
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={paymentMethod === 'VNPay' ? handleVNPayCheckOut : handleCheckOut}
                        className={cx('checkout-btn')}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckOut;
