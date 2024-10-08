import React, { useState, useContext } from 'react';
import { CartContext } from '~/utils/Context/cartContext';
import { MyUserContext } from '~/utils/Context/context'; // Context người dùng
import styles from './AddToCart.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const AddToCartButton = ({ productId }) => {
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const currentUser = useContext(MyUserContext);
    const { addToCart } = useContext(CartContext); // Sử dụng addToCart từ CartContext

    const handleAddToCart = async () => {
        if (!currentUser) {
            setError('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.');
            return;
        }

        try {
            await addToCart([{ product_id: productId, quantity }]);
            setSuccess('Sản phẩm đã được thêm vào giỏ hàng.');
            setError(null);
        } catch (err) {
            setError(err.response?.data.detail || 'Có lỗi xảy ra khi thêm vào giỏ hàng.');
            setSuccess(null);
        }
    };

    return (
        <div className={cx('container')}>
            <input
                className={cx('quantity')}
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
            />
            <button className={cx('btn-add-cart')} onClick={handleAddToCart}>
                Add to Cart
            </button>
        </div>
    );
};

export default AddToCartButton;
