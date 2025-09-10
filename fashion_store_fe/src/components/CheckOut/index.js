import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '~/utils/Context/cartContext';
import styles from './CheckOut.module.scss';
import classNames from 'classnames/bind';
import { authApi } from '~/utils/request';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FormCheckOut from '../FormCheckOut';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid';

const cx = classNames.bind(styles);

const CheckOut = () => {
    const {cartItems, clearCart } = useContext(CartContext);
    const [shippingAddress, setShippingAddress] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [showNote, setShowNote] = useState(false);
    const [note, setNote] = useState('');

    const exchangeRate = 23000;
    const total = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const price = parseFloat(item.product.price);
            return sum + item.quantity * (isNaN(price) ? 0 : price);
        }, 0);
    }, [cartItems]);

    const handleCheckOut = async () => {
        console.log('Clicked');
        console.log('Shipping address:', shippingAddress);
        console.log('Payment method:', paymentMethod);

        let payload = {
            payment_method: paymentMethod,
        };

        // If shippingAddress looks like an object with address fields, try to create or select an address
        try {
            if (shippingAddress && typeof shippingAddress === 'object' && shippingAddress.address_line1) {
                // Create address via API then use its id
                const createRes = await authApi(localStorage.getItem('access_token')).post('/addresses/', shippingAddress);
                if (createRes?.data?.id) {
                    payload.shipping_address_id = createRes.data.id;
                }
            }
        } catch (e) {
            console.error('Create address failed:', e);
        }

        try {
            setLoading(true);
            const response = await authApi(localStorage.getItem('access_token')).post('/orders/checkout/', payload);
            console.log('Checkout response:', response);
            if ((response.status === 200 || response.status === 201) && response.data) {
                if (paymentMethod === 'VNPay' && response.data.payment_url) {
                    // Với VNPay, chuyển hướng đến trang thanh toán
                    window.location.href = response.data.payment_url;
                    // Không clear cart ở đây, sẽ clear sau khi thanh toán thành công
                } else if (paymentMethod === 'PayPal' && response.data.payment_url) {
                    // Với PayPal, chuyển hướng đến trang thanh toán
                    window.location.href = response.data.payment_url;
                    // Không clear cart ở đây, sẽ clear sau khi thanh toán thành công
                } else {
                    // Với các phương thức thanh toán khác (Cash, ZaloPay, Momo), clear cart ngay lập tức
                    clearCart();
                    navigate('/payment-success', { state: { orderData: response.data } });
                }
            } else {
                toast.error('Checkout failed, please try again');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const errorMessage = error.response?.data?.message || 'An error occurred, please try again later';
            toast.error(errorMessage);
            navigate('/payment-failed', { 
                state: { 
                    errorMessage: errorMessage,
                    orderData: { total_amount: total }
                } 
            });
        } finally {
            
            setLoading(false);
        }
    };

    const handlePayPalSuccess = async (data, actions) => {
        console.log('PayPal data:', data); // Log PayPal data
        if (data && data.id) {
            try {
                const payload = {
                    payment_method: 'PayPal', // Payment method
                    order_id: data.id, // PayPal transaction ID
                };

                const response = await authApi(localStorage.getItem('access_token')).post('/orders/checkout/', payload);

                if (response.status === 200) {
                    clearCart(); // Clear cart only on successful payment
                    toast.success('PayPal payment successful!');
                    navigate('/payment-success', { state: { orderData: response.data } });
                } else {
                    toast.error('An error occurred while confirming payment.');
                }
            } catch (error) {
                console.error('Error processing PayPal payment:', error);
                toast.error('Error processing PayPal payment');
            }
        } else {
            toast.error('Invalid payment information.');
        }
    };

    const paymentMethods = [
        {
            value: 'Cash',
            label: 'Cash on delivery (COD)',
            img: null,
        },
        {
            value: 'ZaloPay',
            label: 'ZaloPay',
            img: 'https://cdn.brandfetch.io/id_T-oXJkN/w/1624/h/1624/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1751816051661',
        },
        {
            value: 'VNPay',
            label: 'VNPay',
            img: 'https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg',
        },
        {
            value: 'Momo',
            label: 'Momo',
            img: 'https://cdn.brandfetch.io/idn4xaCzTm/w/1666/h/1666/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1734358527203',
        },
        {
            value: 'PayPal',
            label: 'PayPal',
            img: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Paypal_2014_logo.png',
        },
    ];

    return (
        <div className={cx('checkout-container')}>
            <div className={cx('header-checkout')}>
                <div className={cx('header-checkout-item')}>
                    <span className={cx('breadcrumb-item')}>Home</span>
                    <span className={cx('breadcrumb-item')}>/</span>
                    <span className={cx('breadcrumb-item-checkout')}>Checkout</span>
                </div>
            </div>
            <div className={cx('checkout-grid')}>
                <div className={cx('left-col')}>
                    <div className={cx('box', 'shipping-info')}>
                        <h3 className={cx('title')}>Delivery Information</h3>
                        <div className={cx('form-group')}>
                            <FormCheckOut onAddressChange={setShippingAddress} />
                        </div>
                    </div>
                </div>
                <div className={cx('center-col')}>
                    <div className={cx('box', 'payment-method')}>
                        <div className={cx('payment-method-header')}>
                            <h3 className={cx('title')}>Payment Method</h3>
                            <button
                                type="button"
                                className={cx('change-btn')}
                                onClick={() => setShowPaymentModal(true)}
                            >
                                Change
                            </button>
                        </div>
                        {showPaymentModal && (
                            <div className={cx('modal-overlay')}>
                                <div className={cx('modal')}>
                                    <button className={cx('modal-close')} onClick={() => setShowPaymentModal(false)}>
                                        &times;
                                    </button>
                                    <h3 className={cx('title')}>Payment Method</h3>
                                    <div className={cx('payment-options')}>
                                        {paymentMethods.map((method) => (
                                            <label className={cx('payment-option')} key={method.value}>
                                                <div className={cx('payment-option-item')}>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value={method.value}
                                                        checked={paymentMethod === method.value}
                                                        onChange={() => setPaymentMethod(method.value)}
                                                    />
                                                    <span>{method.label}</span>
                                                </div>
                                                {method.img && (
                                                    <img
                                                        src={method.img}
                                                        alt={method.label}
                                                        className={cx('pay-logo')}
                                                    />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                    <button className={cx('modal-confirm')} onClick={() => setShowPaymentModal(false)}>
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={cx('payment-method-description')}>
                            {(() => {
                                const selected = paymentMethods.find((m) => m.value === paymentMethod);
                                return (
                                    selected && (
                                        <div className={cx('payment-method-description-item')}>
                                            <span>{selected.label}</span>
                                            {selected.img && (
                                                <img
                                                    src={selected.img}
                                                    alt={selected.label}
                                                    className={cx('pay-logo')}
                                                />
                                            )}
                                        </div>
                                    )
                                );
                            })()}
                        </div>
                    </div>
                    <div className={cx('box', 'voucher')}>
                        <h3 className={cx('title')}>Voucher/coupon</h3>
                        <input type="text" className={cx('input')} placeholder="Enter voucher code" />
                    </div>
                    <div className={cx('box', 'note-order')}>
                        <div className={cx('note-order-header')}>
                            <h3 className={cx('title')}>Order notes</h3>
                            <label className={cx('checkbox-label')}>
                                <input
                                    type="checkbox"
                                    checked={showNote}
                                    onChange={() => setShowNote((prev) => !prev)}
                                    className={cx('checkbox-input')}
                                />
                                <span
                                    style={{
                                        background: showNote ? '#219a6f' : '#ccc',
                                    }}
                                    className={cx('checkbox')}
                                >
                                    <span
                                        style={{
                                            left: showNote ? 20 : 2,
                                        }}
                                        className={cx('checkbox-icon')}
                                    />
                                </span>
                            </label>
                        </div>
                        {showNote && (
                            <textarea
                                className={cx('input-note')}
                                placeholder="Enter your request here"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        )}
                    </div>
                </div>
                <div className={cx('right-col')}>
                    <div className={cx('box', 'order-summary')}>
                        <h3 className={cx('title')}>Order Summary</h3>
                        <div className={cx('cart-items')}>
                            {cartItems.map((item) => (
                                <div key={item.id} className={cx('cart-item')}>
                                    <div className={cx('cart-image-container')}>
                                        <img
                                            src={item.product.image.replace('/media/https%3A', 'https://')}
                                            className={cx('cart-image')}
                                            alt={item.product.name}
                                        />
                                    </div>
                                    <div className={cx('item-info')}>
                                        <h4 className={cx('item-name')}>{item.product.name}</h4>
                                        <div className={cx('quantity-button-container')}>
                                            <MinusIcon className={cx('quantity-icon')} />
                                            <div className={cx('quantity-input')}>{item.quantity}</div>
                                            <PlusIcon className={cx('quantity-icon')} />
                                        </div>
                                        <span className={cx('item-price')}>{item.product.price}đ</span>
                                    </div>
                                </div>
                            ))}

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Order Total</span>
                                <span className={cx('item-total')}>{total.toFixed(3)}đ</span>
                            </div>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Shipping Fee</span>
                                <span className={cx('item-total')}>10000đ</span>
                            </div>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Discount</span>
                                <span className={cx('item-total')}>-10000đ</span>
                            </div>

                            <span className={cx('line')}></span>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Total</span>
                                <span className={cx('item-total')}>{total.toFixed(3)}đ</span>
                            </div>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Estimated Reward Points</span>
                                <span className={cx('item-total')}>0</span>
                            </div>
                        </div>

                        <button onClick={handleCheckOut} className={cx('checkout-btn')} disabled={loading}>
                            {loading ? 'Processing...' : 'Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckOut;
