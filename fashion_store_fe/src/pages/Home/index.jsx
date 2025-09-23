import React, { useState, useEffect } from 'react';
import 'react-awesome-slider/dist/styles.css';
import banner3 from '~/assets/images/banner3.jpg';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import { Link } from 'react-router-dom';
import * as ProductService from '~/api/productService';
import ProductItem from '~/components/ProductItem';

const cx = classNames.bind(styles);

const Home = () => {
    const [latestProducts, setLatestProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch latest 3 products when component mounts
    useEffect(() => {
        const fetchLatestProducts = async () => {
            setLoading(true);
            try {
                const result = await ProductService.getLatestProducts(4);
                setLatestProducts(result.results || []);
            } catch (error) {
                console.error('Error fetching latest products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestProducts();
    }, []);

    return (
        <div className={cx('container')}>
            <div className={cx('banner-container')}>
                <img src={banner3} alt="banner" className={cx('banner')} />
                <Link to={'/products'}>
                    <button className={cx('button')}>Shop Now</button>
                </Link>
            </div>

            {/* Latest Products Section */}
            <div className={cx('latest-products-section')}>
                <div className={cx('title-container')}>
                    <div className={cx('title-wrapper')}>
                        <h2 className={cx('title')}>New Arrivals</h2>
                        <p className={cx('subtitle')}>Fresh Selection</p>
                    </div>
                    <div className={cx('btn-view-all')}>
                        <Link to={'/products'}>
                            View All Products
                        </Link>
                    </div>
                </div>
                {loading ? (
                    <p>Loading latest products...</p>
                ) : (
                    <div className={cx('products-list')}>
                        {latestProducts.map((product) => (
                            <ProductItem key={product.id} data={product} />
                        ))}
                    </div>
                )}
                {latestProducts.length === 0 && !loading && <p>No products available.</p>}
            </div>
        </div>
    );
};

export default Home;
