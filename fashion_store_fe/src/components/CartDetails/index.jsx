import React, { useContext, useState } from 'react';
import styles from './CartDetail.module.scss';
import classNames from 'classnames/bind';
import { CartContext } from '~/utils/Context/cartContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { TrashIcon } from '@heroicons/react/24/solid';


const cx = classNames.bind(styles);

const CartDetail = () => {
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
            setError('Cập nhật số lượng thất bại');
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await removeCartItem(itemId);
            setError(null);
        } catch (error) {
            setError('Xóa sản phẩm thất bại');
        }
    };

    const handlecheckout = () => {
        navigate('/checkout');
    };

    return (
        <section className={cx('cart-detail-container')}>
            <h2 className={cx('title')}>Cart Details</h2>
            {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <div className={cx('cart-list')}>
                    {cartItems.map((item) => (
                        <div className={cx('cart-item')} key={item.id}>
                            {item.product && item.product.thumbnail ? (
                                <img
                                    src={item.product.thumbnail.replace('/media/https%3A', 'https://')}
                                    className={cx('product-image')}
                                    alt={item.product.name}
                                />
                            ) : (
                                <div className={cx('no-thumbnail')}>No thumbnail</div>
                            )}
                            <div className={cx('item-details')}>
                                <h5>{item.product ? item.product.name : 'Unknown Product'}</h5>
                                <div className={cx('flex')}>
                                    <div className={cx('item-price')}>{item.product.price}</div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                        className={cx('quantity-input')}
                                    />
                                    <div className={cx('item-price')}>
                                        ${item.total_price ? parseFloat(item.total_price).toFixed(0) : '0'}
                                    </div>
                                    <button onClick={() => handleRemoveItem(item.id)} className={cx('remove-item')}>
                                        <TrashIcon className={cx('icon')} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={cx('cart-summary')}>
                <h4>Total: ${total.toFixed(0)}</h4>
                <button className={cx('checkout-btn')} onClick={handlecheckout}>
                    Proceed to Checkout
                </button>
            </div>
            {error && <p className={cx('error')}>{error}</p>}
        </section>
    );
};

export default CartDetail;
