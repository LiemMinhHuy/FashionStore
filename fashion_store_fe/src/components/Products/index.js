import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Products.module.scss';
import * as ProductByCategoryId from '~/api/productByCateId'; // Giả định file api của bạn
import { isCloseToBottom } from '~/utils/utils';
import AddToCartButton from '../AddToCart';

const cx = classNames.bind(styles);

function Products() {
    const [products, setProducts] = useState([]); // State để lưu danh sách sản phẩm
    const [loading, setLoading] = useState(true); // State để kiểm soát loading
    const [error, setError] = useState(null); // State để lưu lỗi nếu có
    const [categoryName, setCategoryName] = useState('');
    const { categoryId } = useParams(); // Lấy categoryId từ URL params
    const [page, setPage] = useState(1); // State để theo dõi số trang
    const [hasMore, setHasMore] = useState(true);

    // Fetch data khi component mount hoặc số trang thay đổi
    useEffect(() => {
        const loadProducts = async () => {
            if (!hasMore && page !== 1) return;

            try {
                setLoading(true);
                // Fetch sản phẩm
                const response = await ProductByCategoryId.product(categoryId, page);
                console.log('Response received:', response); // Kiểm tra dữ liệu nhận được

                if (response && response.results && Array.isArray(response.results)) {
                    if (page === 1) {
                        setProducts(response.results);
                    } else if (page > 1) {
                        setProducts((prevProducts) => {
                            return [...prevProducts, ...response.results];
                        });
                    }

                    if (response.next === null) {
                        setHasMore(null);
                    }

                    // Lấy tên danh mục từ sản phẩm đầu tiên
                    if (
                        response.results.length > 0 &&
                        response.results[0].category &&
                        response.results[0].category.name
                    ) {
                        setCategoryName(response.results[0].category.name);
                    } else {
                        setCategoryName('Products');
                    }
                } else {
                    if (page === 1) {
                        setProducts([]);
                    }
                    setProducts([]); // Nếu không có kết quả, đặt sản phẩm thành mảng rỗng
                    setCategoryName('Products');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error occurred:', err); // In lỗi ra console
                setError(err.message); // Lưu thông báo lỗi
                setLoading(false);
            }
        };

        loadProducts(); // Gọi hàm loadProducts
    }, [categoryId, page, hasMore]);

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setProducts([]); // Reset danh sách sản phẩm khi chuyển đổi danh mục
    }, [categoryId]);

    // Xử lý sự kiện cuộn trang
    const handleScroll = () => {
        if (loading || !hasMore) {
            return;
        }

        if (isCloseToBottom(window)) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll); // Dọn dẹp sự kiện khi component unmount
        };
    }, [handleScroll]);

    // Nếu đang tải dữ liệu
    if (loading) {
        return <h2>Loading products...</h2>;
    }

    // Nếu có lỗi
    if (error) {
        return <h2>Error: {error}</h2>;
    }

    // Hiển thị danh sách sản phẩm
    return (
        <div className={cx('products')}>
            <h2 className={cx('category-name')}>{categoryName}</h2>
            <div className={cx('product-list')}>
                {products.length > 0 ? (
                    products.map((product) => (
                        <div className={cx('product-item')} key={product.id}>
                            <Link to={`/products/${product.id}`}>
                                <img
                                    src={product.image ? product.image.replace('/media/https%3A', 'https://') : ''}
                                    alt={product.name}
                                    className={cx('product-image')}
                                />
                            </Link>
                            <div className={cx('product-text')}>
                                <h3>{product.name}</h3>
                                <p>Price: {product.price} VND</p>
                                <div className={cx('btn-add-cart')}>
                                    <AddToCartButton productId={product.id} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No products found in this category.</p>
                )}
            </div>
        </div>
    );
}

export default Products;
