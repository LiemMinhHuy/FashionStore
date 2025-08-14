import React, { useEffect, useState } from 'react';
import { authApi } from '~/utils/request';
import styles from './Order.module.scss';
import classNames from 'classnames/bind';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Tippy from '@tippyjs/react/headless';
import { Wrapper as PopperWrapper } from '~/components/Popper';

const cx = classNames.bind(styles);

const Order = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [currentStatus, setCurrentStatus] = useState('Pending');
    const [expandedOrders, setExpandedOrders] = useState([]);
    const [active, setActive] = useState('Orders');
    const [orderId, setOrderId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [filterValues, setFilterValues] = useState({
        orderType: '',
        paymentStatus: '',
    });

    const fetchOrders = async (pageNum = 1, searchOrderId = '') => {
        setLoading(true);
        if (searchOrderId.trim()) {
            setIsSearching(true);
        }
        try {
            let url = `/orders/user-orders/?page=${pageNum}`;

            // Thêm parameter tìm kiếm theo Order ID nếu có
            if (searchOrderId.trim()) {
                url += `&order_id=${searchOrderId.trim()}`;
            }

            const response = await authApi(localStorage.getItem('access_token')).get(url);
            if (Array.isArray(response.data)) {
                setOrders(response.data);
                setCount(response.data.length);
            } else if (response.data && Array.isArray(response.data.results)) {
                setOrders(response.data.results);
                setCount(response.data.count);
            } else {
                setError('Invalid data format');
            }
        } catch (error) {
            setError('Failed to fetch orders');
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchOrders(page);
    }, [page]);

    useEffect(() => {
        setPage(1);
    }, [currentStatus]);

    const toggleOrderDetails = (orderId) => {
        setExpandedOrders((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
        );
    };

    const handleSearchOrder = () => {
        setPage(1); // Reset về trang đầu tiên khi tìm kiếm
        fetchOrders(1, orderId);
    };

    const handleOrderIdChange = (e) => {
        setOrderId(e.target.value);
        // Tự động tìm kiếm khi người dùng nhập (debounce)
        if (e.target.value.trim() === '') {
            fetchOrders(1, '');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchOrder();
        }
    };

    const handleClearSearch = () => {
        setOrderId('');
        setPage(1);
        fetchOrders(1, '');
    };

    const handleActive = (tabItem) => {
        setActive(tabItem);
    };

    const handleFilterChange = (filterType, value) => {
        setFilterValues((prev) => ({
            ...prev,
            [filterType]: value,
        }));
        console.log('Filter changed:', filterType, value);
    };

    const FilterMenu = ({ children }) => {
        const [showFilter, setShowFilter] = useState(false);
        const [tempFilterValues, setTempFilterValues] = useState(filterValues);

        const handleTempFilterChange = (filterType, value) => {
            setTempFilterValues((prev) => ({
                ...prev,
                [filterType]: value,
            }));
        };

        const handleSave = () => {
            setFilterValues(tempFilterValues);
            setShowFilter(false);
        };

        const handleCancel = () => {
            setTempFilterValues(filterValues);
            setShowFilter(false);
        };

        const renderFilterContent = (attrs) => (
            <div className={cx('filter-menu')} tabIndex="-1" {...attrs}>
                <PopperWrapper className={cx('filter-popper')}>
                    <div className={cx('filter-content')}>
                        <div className={cx('filter-section')}>
                            <label className={cx('filter-label')}>Order Type</label>
                            <div className={cx('select-wrapper')}>
                                <select
                                    className={cx('filter-select')}
                                    value={tempFilterValues.orderType}
                                    onChange={(e) => handleTempFilterChange('orderType', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="purchase">Purchase</option>
                                    <option value="return">Return</option>
                                    <option value="exchange">Exchange</option>
                                </select>
                                <div className={cx('select-arrow')}>▼</div>
                            </div>
                        </div>

                        <div className={cx('filter-section')}>
                            <label className={cx('filter-label')}>Order Status</label>
                            <div className={cx('select-wrapper')}>
                                <select
                                    className={cx('filter-select')}
                                    value={tempFilterValues.paymentStatus}
                                    onChange={(e) => handleTempFilterChange('paymentStatus', e.target.value)}
                                >
                                    <option value="">Select</option>
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div className={cx('select-arrow')}>▼</div>
                            </div>
                        </div>

                        <div className={cx('filter-actions')}>
                            <button className={cx('btn-cancel')} onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className={cx('btn-save')} onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </PopperWrapper>
            </div>
        );

        return (
            <Tippy
                interactive
                delay={[0, 700]}
                offset={[12, 8]}
                hideOnClick={false}
                placement="bottom-end"
                render={renderFilterContent}
                onHide={() => setShowFilter(false)}
                onShow={() => setTempFilterValues(filterValues)}
            >
                {children}
            </Tippy>
        );
    };

    const totalPages = Math.ceil(count / pageSize);
    const renderPagination = () => {
        if (totalPages <= 1) return null;
        let pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                pages.push(
                    <button
                        key={i}
                        className={cx('page-btn', { active: i === page })}
                        onClick={() => setPage(i)}
                        disabled={i === page}
                    >
                        {i}
                    </button>,
                );
            } else if ((i === page - 2 && i > 2) || (i === page + 2 && i < totalPages - 1)) {
                pages.push(<span key={i}>...</span>);
            }
        }
        return (
            <div className={cx('pagination')}>
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className={cx('btn-pagination')}>
                    {'<'}
                </button>
                {pages.map((p) => (
                    <span key={p.key || p} className={cx('btn-pagination')}>
                        {p}
                    </span>
                ))}
                <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className={cx('btn-pagination')}
                >
                    {'>'}
                </button>
            </div>
        );
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short', // Aug
            day: '2-digit', // 03
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // dùng 24h format
        });
    };

    if (loading) return <div className={cx('loading')}>Loading...</div>;
    if (error) return <div className={cx('error')}>{error}</div>;

    return (
        <div className={cx('order-list-container')}>
            <h1 className={cx('title')}>My Orders</h1>

            <div className={cx('tabbar')}>
                <span
                    className={cx('tab-item', { active: active === 'Orders' })}
                    onClick={() => handleActive('Orders')}
                >
                    Orders
                </span>
                <span
                    className={cx('tab-item', { active: active === 'Returns' })}
                    onClick={() => handleActive('Returns')}
                >
                    Returns
                </span>
                <span
                    className={cx('tab-item', { active: active === 'Exchanges' })}
                    onClick={() => handleActive('Exchanges')}
                >
                    Exchanges
                </span>
            </div>

{/* Search order by ID */}
            <div className={cx('order-filter')}>
                <div className={cx('filter-item', 'search-orderId')}>
                    <button onClick={handleSearchOrder} className={cx('search-btn')} disabled={isSearching}>
                        <MagnifyingGlassIcon className={cx('filter-icon')} />
                    </button>
                    <input
                        type="text"
                        placeholder={isSearching ? 'Searching...' : 'Search Order ID'}
                        value={orderId}
                        onChange={handleOrderIdChange}
                        onKeyPress={handleKeyPress}
                        className={cx('search-input')}
                        disabled={isSearching}
                    />
                    {orderId && !isSearching && (
                        <button onClick={handleClearSearch} className={cx('clear-btn')}>
                            ×
                        </button>
                    )}
                </div>

                <FilterMenu>
                    <div className={cx('filter-item', 'btn-filter')}>
                        <FunnelIcon className={cx('filter-icon')} />
                        <div className={cx('filter-text')}>Filter</div>
                    </div>
                </FilterMenu>

                <div className={cx('filter-item', 'date-range')}>
                    <input type="date" placeholder="Start Date" />
                    <input type="date" placeholder="End Date" />
                </div>
            </div>

            <div className={cx('orders')}>
                {orders.length === 0 ? (
                    <div className={cx('no-orders')}>
                        {orderId ? (
                            <p>No orders found with Order ID "{orderId}".</p>
                        ) : (
                            <p>No orders found with status "{currentStatus}".</p>
                        )}
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className={cx('order-items')}>
                            <div className={cx('order-item')}>
                                <p>
                                    <strong>ID:</strong> {order.id}
                                </p>
                                <p>
                                    <strong>Date: </strong> {formatDateTime(order.created_at)}
                                </p>
                                <p>
                                    <strong>Total:</strong> {parseFloat(order.total_amount).toFixed(2)}$
                                </p>
                            </div>
                            <div className={cx('order-item')}>
                                <p>
                                    <strong>Address:</strong> {order.shipping_address}
                                </p>
                            </div>
                            <div className={cx('order-item')}>
                                <p className={cx('order-status')}>{order.status}</p>
                                <div className={cx('btn-container')}>
                                    <button className={cx('btn-detail')}>Detail</button>
                                    <button className={cx('btn-reorder')}>Reorder</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {renderPagination()}
        </div>
    );
};

export default Order;
