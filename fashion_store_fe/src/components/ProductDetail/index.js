import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductDetail.module.scss'; // Đường dẫn tới file SCSS của bạn
import * as productDetail from '~/api/productDetail'; // Gọi API để lấy sản phẩm
import { CartContext } from '~/utils/Context/cartContext';
import { MyUserContext } from '~/utils/Context/context';
import Alert from '../Alert';
import Breadcrumb from '../Breadcrumb';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function ProductDetail() {
    const { productId } = useParams(); // Lấy productId từ URL
    const [product, setProduct] = useState(null); // State để lưu thông tin sản phẩm
    const [loading, setLoading] = useState(true); // State để kiểm soát loading
    const [error, setError] = useState(null); // State để lưu lỗi nếu có
    const [success, setSuccess] = useState(null);
    const currentUser = useContext(MyUserContext);
    const { addToCart } = useContext(CartContext); // Sử dụng addToCart từ CartContext
    const [quantity, setQuantity] = useState(1);

    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (value >= 1 && value <= 100) {
            setQuantity(value);
        }
    };

    const handleAddToCart = async () => {
        if (!currentUser) {
            setError('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.');
            return;
        }
        try {
            await addToCart([{ product_id: productId, quantity: quantity }]);
            setSuccess('Sản phẩm đã được thêm vào giỏ hàng.');
            setError(null);
        } catch (err) {
            console.log('Lỗi chi tiết:', err.response?.data);
            setError(err.response?.data.detail || 'Có lỗi xảy ra khi thêm vào giỏ hàng.');
            setSuccess(null);
        }
    };

    // Fetch data khi component mount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await productDetail.productdetail(productId); // Gọi API để lấy sản phẩm
                console.log('API Response:', response); // Log phản hồi từ API

                if (response) {
                    // Nếu API trả về sản phẩm trực tiếp
                    setProduct(response);
                } else {
                    setError('Product not found');
                }
            } catch (err) {
                console.error('Error occurred:', err);
                setError('An error occurred while fetching product details');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct(); // Gọi hàm fetchProduct
    }, [productId]);

    // Nếu đang tải dữ liệu
    if (loading) {
        return <h2>Loading product details...</h2>;
    }

    // Nếu có lỗi
    if (error) {
        return <h2>Error: {error}</h2>;
    }

    // Kiểm tra xem sản phẩm có hợp lệ không trước khi truy cập thuộc tính
    if (!product) {
        return <h2>Product not found.</h2>; // Thông báo nếu không có sản phẩm
    }

    // Hiển thị thông tin sản phẩm
    return (
        <div className={cx('product-detail')}>
            <Breadcrumb className={cx('breadcrumb')}>
                <Link to="/products">Shop</Link>
                <Link to={`/products/${product.id}`}>{product.category.name}</Link>
                <span>{product.name}</span>
            </Breadcrumb>
            <div className={cx('product-detail-container')}>
                <div className={cx('product-image-container')}>
                    <img
                        src={product.image ? product.image.replace('/media/https%3A', 'https://') : ''} // Xử lý đường dẫn ảnh
                        alt={product.name}
                    />
                </div>
                <div className={cx('product-info-container')}>
                    <h2 className={cx('product-name')}>{product.name}</h2>
                    <p className={cx('product-price')}>$ {product.price}</p>
                    <p className={cx('product-description')}>{product.description}</p>
                    <div className={cx('product-quantity')}>
                        <span className={cx('product-quantity-text')}>Quantity:</span>
                        <input type="number" min="1" max="100" value={quantity} onChange={handleQuantityChange} />
                    </div>
                    <button className={cx('btn-add-to-cart')} onClick={handleAddToCart}>
                        Add to Cart
                    </button>
                    {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} autoClose={true} autoCloseTime={2000} />}
                    {error && <Alert message={error} type="error" />}
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
