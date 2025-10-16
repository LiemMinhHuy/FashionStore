import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductDetail.module.scss'; // Đường dẫn tới file SCSS của bạn
import * as productDetail from '~/api/productDetail'; // Gọi API để lấy sản phẩm
import { CartContext } from '~/utils/Context/cartContext';
import { MyUserContext } from '~/utils/Context/context';
import Breadcrumb from '~/components/Breadcrumb';
import Alert from '~/components/Alert';
import { Link } from 'react-router-dom';
import RequireAuth from '~/components/RequireAuth';

const cx = classNames.bind(styles);

function ProductDetail() {
	const { productId } = useParams(); // Lấy productId từ URL
	const [product, setProduct] = useState(null); // State để lưu thông tin sản phẩm
	const [loading, setLoading] = useState(true); // State để kiểm soát loading
	const [error, setError] = useState(null); // State để lưu lỗi nếu có
	const [success, setSuccess] = useState(null);
	const currentUser = useContext(MyUserContext);
	const { addToCart } = useContext(CartContext); // Use addToCart from CartContext
	const [quantity, setQuantity] = useState(1);
	const [selectedImageUrl, setSelectedImageUrl] = useState('');

	const handleQuantityChange = (e) => {
		const value = parseInt(e.target.value);
		if (value >= 1 && value <= 100) {
			setQuantity(value);
		}
	};

	const handleAddToCart = async () => {
		if (!currentUser) {
			setError('You need to login to add products to cart.');
			return;
		}
		try {
			await addToCart([{ product_id: productId, quantity: quantity }]);
			setSuccess('Product has been added to cart.');
			setError(null);
		} catch (err) {
			console.log('Detailed error:', err.response?.data);
			setError(err.response?.data.detail || 'An error occurred while adding to cart.');
			setSuccess(null);
		}
	};

	// Fetch data when component mounts
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

		fetchProduct(); // Call fetchProduct function
	}, [productId]);

	// When product is available, set default image for main frame
	useEffect(() => {
		if (!product) return;
		const thumbUrl = product.thumbnail ? product.thumbnail.replace('/media/https%3A', 'https://') : '';
		const firstGalleryUrl = product.images && product.images[0]?.image
			? product.images[0].image.replace('/media/https%3A', 'https://')
			: '';
		setSelectedImageUrl(thumbUrl || firstGalleryUrl || '');
	}, [product]);

	// If data is loading
	if (loading) {
		return <h2>Loading product details...</h2>;
	}

	// If there is an error
	if (error) {
		return <RequireAuth/>;
	}

	// Check if product is valid before accessing properties
	if (!product) {
		return <h2>Product not found.</h2>; // Notify if no product is available
	}

	// Normalize image URL list: thumbnail + gallery
	const imageUrls = [
		product.thumbnail ? product.thumbnail.replace('/media/https%3A', 'https://') : '',
		...(product.images || []).map((img) => img.image.replace('/media/https%3A', 'https://')),
	].filter(Boolean);

	// Display product information
	return (
		<div className={cx('product-detail')}>
			<Breadcrumb className={cx('breadcrumb')}>
				<Link to="/products">Shop</Link>
				<Link to={`/products/${product.id}`}>{product.category.name}</Link>
				<span>{product.name}</span>
			</Breadcrumb>
			<div className={cx('product-detail-container')}>
				<div className={cx('product-image-container')}>
					<div className={cx('product-image-list')}>
						{imageUrls.map((url) => (
							<img
								key={url}
								src={url}
								alt={product.name}
								className={cx('product-image-item', { active: selectedImageUrl === url })}
								onClick={() => setSelectedImageUrl(url)}
							/>
						))}
					</div>
					<div className={cx('product-image-main')}>
						<img
							src={selectedImageUrl}
							alt={product.name}
							className={cx('product-image')}
						/>
					</div>
				</div>
				<div className={cx('product-info-container')}>
					<h2 className={cx('product-name')}>{product.name}</h2>
					<p className={cx('product-description')}>{product.description}</p>
					<p className={cx('product-price')}>${product.price}</p>
					<div className={cx('product-quantity')}>
						<span className={cx('product-quantity-text')}>Quantity:</span>
						<input type="number" min="1" max="100" value={quantity} onChange={handleQuantityChange} />
					</div>
					<button className={cx('btn-add-to-cart')} onClick={handleAddToCart}>
						Add to Cart
					</button>
					{success && (
						<Alert
							message={success}
							type="success"
							onClose={() => setSuccess(null)}
							autoClose={true}
							autoCloseTime={2000}
						/>
					)}
					{error && <Alert message={error} type="error" />}
				</div>
			</div>
		</div>
	);
}

export default ProductDetail;
