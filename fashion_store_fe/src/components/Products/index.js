import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Products.module.scss';
import * as ProductByCategoryId from '~/api/productByCateId';
import { isCloseToBottom } from '~/utils/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import throttle from 'lodash.throttle';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { FunnelIcon, Bars3BottomRightIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

const cx = classNames.bind(styles);

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categoryName, setCategoryName] = useState('Products');
    const { categoryId } = useParams();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [sortOption, setSortOption] = useState('latest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    const hasMoreRef = useRef(hasMore);
    const isFetchingRef = useRef(false);
    const pageRef = useRef(page);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // Reset state when categoryId changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setProducts([]);
        setError(null);
        setSortOption('latest');
    }, [categoryId]);

    // Fetch products based on categoryId, page, and sortOption
    useEffect(() => {
        const loadProducts = async () => {
            if (!hasMoreRef.current && pageRef.current !== 1) {
                console.log('No more pages to load.');
                return;
            }

            if (isFetchingRef.current) return;

            isFetchingRef.current = true;
            setLoading(true);
            try {
                const response = await ProductByCategoryId.product(categoryId, page, sortOption);

                if (response && response.results) {
                    setProducts((prevProducts) =>
                        page === 1 ? response.results : [...prevProducts, ...response.results],
                    );
                    setHasMore(response.next && response.results.length > 0);
                    setCategoryName(response.results[0]?.category?.name || categoryName);
                } else {
                    setHasMore(false);
                    setError('No products found in this category.');
                    console.log('No products found, setting hasMore to false.');
                }
            } catch (err) {
                console.error('Error occurred:', err);
                setError('Error loading products.');
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        };

        loadProducts();
    }, [categoryId, page]);

    const handleScroll = useCallback(
        throttle(() => {
            if (!loading && hasMoreRef.current && isCloseToBottom(window)) {
                console.log('Near bottom of the page, loading more:', pageRef.current + 1);
                setPage((prevPage) => prevPage + 1);
            }
        }, 300),
        [loading],
    );

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleSort = (option) => {
        setSortOption(option);
        setShowSortMenu(false);
    };

    if (loading && page === 1 && products.length === 0) return <h2>Loading products...</h2>;
    if (error) return <h2>Error: {error}</h2>;

    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Explore Our Shop</h1>
                <p className={cx('description')}>Discover handpicked products made just for you.</p>
            </div>
            <div className={cx('wrapper')}>
                <aside className={cx('sort-bar')}>
                    <div className={cx('sort-bar-item')}>
                        <div className={cx('sort-bar-item')}>
                            <span className={cx('breadcrumb-item')}>Shop</span>
                            <span className={cx('breadcrumb-item')}>/</span>
                            <span className={cx('breadcrumb-item')}>{categoryName}</span>
                        </div>
                        <div className={cx('sort-bar-item-count')}>
                            {products.length} products
                        </div>
                    </div>
                    <div className={cx('sort-bar-item')} style={{ position: 'relative' }}>
                        <FunnelIcon className={cx('sort-bar-icon')} />
                        <Bars3BottomRightIcon
                            className={cx('sort-bar-icon')}
                            onClick={() => setShowSortMenu((prev) => !prev)}
                            style={{ cursor: 'pointer' }}
                        />
                        {showSortMenu && (
                            <div className={cx('sort-dropdown')}>
                                <div className={cx('sort-dropdown-title')}>Sort by</div>
                                <div
                                    className={cx('sort-dropdown-item', { active: sortOption === 'price-desc' })}
                                    onClick={() => handleSort('price-desc')}
                                >
                                    <ArrowDownIcon className={cx('sort-dropdown-icon')} />
                                    High to Low
                                </div>
                                <div
                                    className={cx('sort-dropdown-item', { active: sortOption === 'price-asc' })}
                                    onClick={() => handleSort('price-asc')}
                                >
                                    <ArrowUpIcon className={cx('sort-dropdown-icon')} />
                                    Low to High
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
                <div>
                    <div className={cx('product-list')}>
                        {products.length > 0 ? (
                            products.map((product) => (
                                <div className={cx('product-item')} key={product.id}>
                                    <Link to={`/products/${product.id}`} className={cx('image-link')}>
                                        <img
                                            src={
                                                product.image
                                                    ? product.image.replace('/media/https%3A', 'https://')
                                                    : '/path/to/default/image.jpg'
                                            }
                                            alt={product.name}
                                            className={cx('product-image')}
                                        />
                                        <div className={cx('btn')}>
                                            <FontAwesomeIcon icon={faEye} />
                                        </div>
                                        <div className={cx('product-text')}>
                                            <h3>{product.name}</h3>
                                            <p>Price: {product.price} VND</p>
                                        </div>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <p>No products found in this category.</p>
                        )}
                    </div>
                </div>
                {loading && page > 1 && <h2>Loading more products...</h2>}
                {!hasMore && <p></p>}
                <ToastContainer />
            </div>
        </div>
    );
}

export default Products;
