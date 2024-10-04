import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductDetail.module.scss'; // Đường dẫn tới file SCSS của bạn
import * as productDetail from '~/api/productDetail'; // Gọi API để lấy sản phẩm

const cx = classNames.bind(styles);

function ProductDetail() {
    const { productId } = useParams(); // Lấy productId từ URL
    const [product, setProduct] = useState(null); // State để lưu thông tin sản phẩm
    const [loading, setLoading] = useState(true); // State để kiểm soát loading
    const [error, setError] = useState(null); // State để lưu lỗi nếu có

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

    // Hàm xử lý sự kiện mua hàng
    const handleBuyNow = () => {
        // Thêm logic để xử lý mua hàng, ví dụ điều hướng đến trang thanh toán
        console.log('Buy Now clicked for product:', productId);
        // Redirect to the payment page or show a payment modal
    };

    // Hiển thị thông tin sản phẩm
    return (
        <div className={cx('product-detail')}>
            <Link to="/products">Back to Products</Link>
            <div className={cx('product-info')}>
                <img
                    src={product.image ? product.image.replace('/media/https%3A', 'https://') : ''} // Xử lý đường dẫn ảnh
                    alt={product.name}
                    className={cx('product-image')}
                />
                <h2 className={cx('product-name')}>{product.name}</h2>
                <p className={cx('product-price')}>Price: ${product.price}</p>
                <p className={cx('product-description')}>{product.description}</p>
                <div className={cx('btn')}>
                    <button className={cx('add-to-cart')}>Add to Cart</button>
                    <button className={cx('btn-buy')} onClick={handleBuyNow}>
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
