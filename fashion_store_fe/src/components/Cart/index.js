import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import styles from './Cart.module.scss';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { CartContext } from '~/utils/Context/cartContext';

const cx = classNames.bind(styles);

const Cart = ({ onClose }) => {
    const { cartItems, updateCartItem, removeCartItem } = useContext(CartContext);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Khai báo useNavigate

    // Tính tổng tiền
    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);

    const handleQuantityChange = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            await updateCartItem(itemId, newQuantity);
            setError(null);
        } catch (error) {
            console.error('Failed to update quantity:', error);
            setError('Cập nhật số lượng thất bại');
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await removeCartItem(itemId);
            setError(null);
        } catch (error) {
            console.error('Failed to remove item:', error);
            setError('Xóa sản phẩm thất bại');
        }
    };

    const handleViewCartDetails = () => {
        navigate('/cart-details'); // Điều hướng đến trang chi tiết giỏ hàng
    };

    return (
        <div>
            <div className={cx('overlay')} onClick={onClose}></div>
            <section className={cx('cart-container')}>
                <div className={cx('cart-content')}>
                    <div className={cx('btn')}>
                        <button onClick={onClose}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <span>Continue shopping</span>
                    </div>
                    <hr />
                    <div className={cx('title')}>
                        <div>
                            <p className={cx('mb-1')}>My Cart</p>
                            <p className={cx('mb-0')}>You have {cartItems.length} items in your cart</p>
                        </div>
                    </div>

                    {cartItems.map((item) => (
                        <div className={cx('cart')} key={item.id}>
                            <div className={cx('cart-body')}>
                                <div className={cx('cart-item')}>
                                    {item.product && item.product.image ? (
                                        <img
                                            src={item.product.image.replace('/media/https%3A', 'https://')}
                                            className={cx('img-fluid')}
                                            alt={item.product.name}
                                        />
                                    ) : (
                                        <div className={cx('no-image')}>No Image</div>
                                    )}
                                    <h5>{item.product ? item.product.name : 'Unknown Product'}</h5>
                                </div>
                                <div className={cx('price')}>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                        className={cx('quantity-input')}
                                    />
                                    <div style={{ width: '80px' }}>
                                        <h5 className={cx('mb-0')}>
                                            {item.total_price ? parseFloat(item.total_price).toFixed(2) : '0.00'}VND
                                        </h5>
                                    </div>
                                    <button onClick={() => handleRemoveItem(item.id)} className={cx('btn-trash')}>
                                        <FontAwesomeIcon icon={faTrashCan} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div>
                        <button onClick={handleViewCartDetails} className={cx('view-cart-details-btn')}>
                            View Cart Details
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Cart;
