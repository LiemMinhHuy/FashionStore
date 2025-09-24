import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Products.module.scss';
import * as ProductByCategoryId from '~/api/productByCateId';
import * as ProductService from '~/api/productService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bars3BottomRightIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import ProductItem from '~/components/ProductItem';
import Pagination from '~/components/Pagination';

const cx = classNames.bind(styles);

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categoryName, setCategoryName] = useState('Products');
    const { categoryId } = useParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sortOption, setSortOption] = useState('latest');
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Reset state when categoryId changes
    useEffect(() => {
        setCurrentPage(1);
        setProducts([]);
        setError(null);
        setSortOption('latest');
    }, [categoryId]);

    // Fetch products based on categoryId, currentPage, and sortOption
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                let response;
                if (!categoryId) {
                    response = await ProductService.getAllProducts(currentPage, sortOption);
                } else {
                    response = await ProductByCategoryId.product(categoryId, currentPage, sortOption);
                }


                if (response && response.results) {
                    setProducts(response.results);
                    
                    // Use API pagination metadata if available
                    if (response.count !== undefined) {
                        let calculatedTotalPages;
                        
                        if (response.next === null && response.previous) {
                            // We're on the last page
                            calculatedTotalPages = currentPage;
                        } else if (response.next && !response.previous) {
                            // We're on the first page and there are more pages
                            const currentPageSize = response.results.length;
                            calculatedTotalPages = Math.ceil(response.count / currentPageSize);
                        } else if (response.next && response.previous) {
                            // We're in the middle, calculate based on current page size
                            const currentPageSize = response.results.length;
                            calculatedTotalPages = Math.ceil(response.count / currentPageSize);
                        } else {
                            // No pagination links, we're on the only page
                            calculatedTotalPages = 1;
                        }
                        
                        setTotalPages(calculatedTotalPages);
                    } else {
                        setTotalPages(1);
                    }
                    
                    setTotalItems(response.count || 0);
                    setCategoryName((prev) => response.results[0]?.category?.name || prev);
                } else {
                    setProducts([]);
                    setTotalPages(1);
                    setTotalItems(0);
                    setError('No products found in this category.');
                    // Reset to page 1 if we're on an invalid page
                    if (currentPage > 1) {
                        setCurrentPage(1);
                    }
                }
            } catch (err) {
                console.error('Error occurred:', err);
                setError('Error loading products.');
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [categoryId, currentPage, sortOption]);

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    // Handle invalid page numbers
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const handleSort = (option) => {
        // Normalize incoming UI options to API values
        const normalized = option === 'price-desc' ? 'price_desc' : option === 'price-asc' ? 'price_asc' : option;
        setSortOption(normalized);
        // Reset pagination when changing sort
        setCurrentPage(1);
        setShowSortMenu(false);
    };

    const handlePageChange = (page) => {
        // Validate page number before changing
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        } else {
            console.warn('Invalid page number:', page, 'Total pages:', totalPages); // Debug log
        }
    };

    if (loading && currentPage === 1 && products.length === 0) return <h2>Loading products...</h2>;
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
                        {loading ? (
                            <div className={cx('loading-container')}>
                                <h2>Loading products...</h2>
                            </div>
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <ProductItem key={product.id} data={product} />
                            ))
                        ) : (
                            <p>No products found in this category.</p>
                        )}
                    </div>
                    
                    {/* Pagination */}
                    {!loading && (
                        <div className={cx('pagination-container')}>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </div>
                <ToastContainer />
            </div>
        </div>
    );
}

export default Products;
