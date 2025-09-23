import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Products.module.scss';
import * as ProductByCategoryId from '~/api/productByCateId';
import * as ProductService from '~/api/productService';
import { isCloseToBottom } from '~/utils/utils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import throttle from 'lodash.throttle';
import { Bars3BottomRightIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

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
                let response;
                if (!categoryId) {
                    response = await ProductService.getAllProducts(page, sortOption);
                } else {
                    response = await ProductByCategoryId.product(categoryId, page, sortOption);
                }

                if (response && response.results) {
                    setProducts((prevProducts) =>
                        page === 1 ? response.results : [...prevProducts, ...response.results],
                    );
                    setHasMore(response.next && response.results.length > 0);
                    setCategoryName((prev) => response.results[0]?.category?.name || prev);
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
    }, [categoryId, page, sortOption]);

    useEffect(() => {
        const onScroll = throttle(() => {
            if (!loading && hasMoreRef.current && isCloseToBottom(window)) {
                setPage((prevPage) => prevPage + 1);
            }
        }, 300);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [loading]);

    const handleSort = (option) => {
        // Normalize incoming UI options to API values
        const normalized = option === 'price-desc' ? 'price_desc' : option === 'price-asc' ? 'price_asc' : option;
        setSortOption(normalized);
        // Reset pagination and list when changing sort
        setPage(1);
        setProducts([]);
        setHasMore(true);
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
                            {!categoryId ? (
                                <>
                                    <span className={cx('breadcrumb-item')}>{'>'}</span>
                                    <span className={cx('breadcrumb-item')}>All</span>
                                </>
                            ) : (
                                <>
                                    <span className={cx('breadcrumb-item')}>{'>'}</span>
                                    <span className={cx('breadcrumb-item')}>{categoryName}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={cx('sort-bar-item')} style={{ position: 'relative' }}>
                        <Bars3BottomRightIcon
                            className={cx('sort-bar-icon')}
                            onClick={() => setShowSortMenu((prev) => !prev)}
                            style={{ cursor: 'pointer' }}
                        />
                        {showSortMenu && (
                            <div className={cx('sort-dropdown')}>
                                <div className={cx('sort-dropdown-title')}>Sort by</div>
                                <div
                                    className={cx('sort-dropdown-item', { active: sortOption === 'price_desc' })}
                                    onClick={() => handleSort('price_desc')}
                                >
                                    <ArrowDownIcon className={cx('sort-dropdown-icon')} />
                                    High to Low
                                </div>
                                <div
                                    className={cx('sort-dropdown-item', { active: sortOption === 'price_asc' })}
                                    onClick={() => handleSort('price_asc')}
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
                                        <div className={cx('product-image-container')}>
                                            <img
                                                src={
                                                    product.thumbnail
                                                        ? product.thumbnail
                                                              .replace('/media/https%3A', 'https://')
                                                              .replace('http://127.0.0.1:8000', '')
                                                        : '/path/to/default/image.jpg'
                                                }
                                                alt={product.name}
                                                className={cx('product-image')}
                                            />

                                            <img
                                                src={product.images[0].image
                                                    .replace('/media/https%3A', 'https://')
                                                    .replace('http://127.0.0.1:8000', '')}
                                                alt="product-image"
                                                className={cx('product-image')}
                                            />
                                        </div>

                                        <div className={cx('product-text')}>
                                            <h3>{product.name}</h3>
                                            <p>${product.price ? parseFloat(product.price).toFixed(0) : '0'}</p>
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
