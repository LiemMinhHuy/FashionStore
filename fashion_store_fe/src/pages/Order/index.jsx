import React, { useEffect, useState, useCallback } from 'react';
import { authApi } from '~/utils/request';
import styles from './Order.module.scss';
import classNames from 'classnames/bind';
import { MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Tippy from '@tippyjs/react/headless';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import Menu from '~/components/Popper/Menu';
import 'tippy.js/dist/tippy.css';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

const Order = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);

    const [active, setActive] = useState('Orders');
    const [orderId, setOrderId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [filterValues, setFilterValues] = useState({
        status: '',
        paymentMethod: '',
        sortBy: 'newest',
        startDate: '',
        endDate: '',
    });

    const navigate = useNavigate();

    const ORDER_STATUS_OPTIONS = [
        { title: 'All Status', value: '' },
        { title: 'Pending', value: 'Pending' },
        { title: 'Processing', value: 'Processing' },
        { title: 'Shipping', value: 'Shipping' },
        { title: 'Completed', value: 'Completed' },
        { title: 'Failed', value: 'Failed' },
        { title: 'Canceled', value: 'Canceled' },
        { title: 'Expired', value: 'Expired' },
        { title: 'Refunding', value: 'Refunding' },
        { title: 'Refunded', value: 'Refunded' },
        { title: 'Chargeback', value: 'Chargeback' },
    ];

    const ORDER_PAYMENT_METHOD_OPTIONS = [
        { title: 'All Methods', value: '' },
        { title: 'Cash', value: 'Cash' },
        { title: 'PayPal', value: 'PayPal' },
        { title: 'VNPay', value: 'VNPay' },
    ];

    const SORT_OPTIONS = [
        { title: 'Newest First', value: 'newest' },
        { title: 'Oldest First', value: 'oldest' },
    ];

    const fetchOrders = useCallback(
        async (pageNum = 1, searchOrderId = '', filters = filterValues) => {
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

                // Thêm filter theo status
                if (filters.status) {
                    url += `&status=${filters.status}`;
                }

                // Thêm filter theo payment method
                if (filters.paymentMethod) {
                    url += `&payment_method=${filters.paymentMethod}`;
                }

                // Thêm sort theo thời gian
                if (filters.sortBy) {
                    url += `&sort_by=${filters.sortBy}`;
                }

                // Chỉ áp dụng filter date range khi có cả startDate và endDate
                if (filters.startDate && filters.endDate) {
                    const start = new Date(filters.startDate);
                    const end = new Date(filters.endDate);

                    // Kiểm tra ngày hợp lệ và startDate <= endDate
                    if (!isNaN(start) && !isNaN(end) && start <= end) {
                        url += `&start_date=${filters.startDate}&end_date=${filters.endDate}`;
                    }
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
        },
        [filterValues],
    );

    useEffect(() => {
        fetchOrders(page, '', filterValues); // Load initial data without search
    }, [page, filterValues, fetchOrders]);

    const validateOrderId = (value) => {
        // Kiểm tra OrderID chỉ chứa số và chữ cái và có ít nhất 3 ký tự
        return /^[a-zA-Z0-9]{3,}$/.test(value);
    };

    const handleSearchOrder = () => {
        if (!orderId.trim()) {
            setError('Please enter an Order ID');
            return;
        }

        if (!validateOrderId(orderId)) {
            setError('Order ID must be at least 3 characters and contain only letters and numbers');
            return;
        }

        setError(null); // Reset error nếu có
        setPage(1);
        fetchOrders(1, orderId, filterValues);
    };

    const handleOrderIdChange = (e) => {
        const newValue = e.target.value;
        setOrderId(newValue);

        // Reset error nếu input trống
        if (!newValue.trim()) {
            setError(null);
        }
    };

    const validateDateRange = useCallback((start, end) => {
        if (!start || !end) return false;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return !isNaN(startDate) && !isNaN(endDate) && startDate <= endDate;
    }, []);

    const handleDateRangeChange = (type, value) => {
        setFilterValues((prev) => {
            const newValues = { ...prev, [type]: value };
            // Chỉ thực hiện fetch khi cả 2 giá trị đều có và hợp lệ
            if (validateDateRange(newValues.startDate, newValues.endDate)) {
                fetchOrders(page, orderId, newValues);
            }
            return newValues;
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchOrder();
        }
    };

    const handleClearSearch = () => {
        setOrderId('');
        setPage(1);
        fetchOrders(1, '', filterValues);
    };

    const handleActive = (tabItem) => {
        setActive(tabItem);
    };

    const handleClaimPoints = async (orderId) => {
        try {
            const response = await authApi(localStorage.getItem('access_token')).post(`/orders/${orderId}/claim-points/`);
            if (response.data.message) {
                alert(response.data.message);
                // Refresh orders to update the UI
                fetchOrders(page, orderId, filterValues);
            }
        } catch (error) {
            console.log('Error claiming points:', error);
            alert(error.response?.data?.error || 'Failed to claim points');
        }
    };

    const FilterMenu = ({ children }) => {
        const [tempFilterValues, setTempFilterValues] = useState(filterValues);
        const [isVisible, setIsVisible] = useState(false);

        const handleMenuClick = (e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
        };

        // Chỉ set giá trị ban đầu khi component mount
        useEffect(() => {
            setTempFilterValues(filterValues);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const handleTempFilterChange = (filterType, value) => {
            setTempFilterValues((prev) => ({
                ...prev,
                [filterType]: value,
            }));
        };

        const handleSave = () => {
            setFilterValues(tempFilterValues);
            setIsVisible(false);
        };

        const handleCancel = () => {
            setTempFilterValues(filterValues);
            setIsVisible(false);
        };

        const renderFilterContent = (attrs) => (
            <div className={cx('filter-menu')} tabIndex="-1" {...attrs}>
                <PopperWrapper className={cx('filter-popper')}>
                    <div className={cx('filter-content')}>
                        <div className={cx('filter-section')}>
                            <label className={cx('filter-label')}>Status</label>
                            <div className={cx('select-wrapper')}>
                                <Menu
                                    items={ORDER_STATUS_OPTIONS}
                                    onChange={(item) => {
                                        handleTempFilterChange('status', item.value);
                                    }}
                                >
                                    <div className={cx('menu-trigger')}>
                                        <div className={cx('select-text')}>
                                            {tempFilterValues.status
                                                ? ORDER_STATUS_OPTIONS.find((opt) => opt.value === tempFilterValues.status)
                                                    ?.title
                                                : 'All Status'}
                                        </div>
                                        <div className={cx('select-arrow')}>
                                            <ChevronDownIcon className={cx('filter-icon')} />
                                        </div>
                                    </div>
                                </Menu>
                            </div>
                        </div>

                        <div className={cx('filter-section')}>
                            <label className={cx('filter-label')}>Payment Method</label>
                            <div className={cx('select-wrapper')}>
                                <Menu
                                    items={ORDER_PAYMENT_METHOD_OPTIONS}
                                    onChange={(item) => {
                                        handleTempFilterChange('paymentMethod', item.value);
                                    }}
                                >
                                    <div className={cx('menu-trigger')}>
                                        <div className={cx('select-text')}>
                                            {tempFilterValues.paymentMethod
                                                ? ORDER_PAYMENT_METHOD_OPTIONS.find(
                                                    (opt) => opt.value === tempFilterValues.paymentMethod,
                                                )?.title
                                                : 'All Methods'}
                                        </div>
                                        <div className={cx('select-arrow')}>
                                            <ChevronDownIcon className={cx('filter-icon')} />
                                        </div>
                                    </div>
                                </Menu>
                            </div>
                        </div>

                        <div className={cx('filter-section')}>
                            <label className={cx('filter-label')}>Sort by Time</label>
                            <div className={cx('select-wrapper')}>
                                <Menu
                                    items={SORT_OPTIONS}
                                    onChange={(item) => {
                                        handleTempFilterChange('sortBy', item.value);
                                    }}
                                >
                                    <div className={cx('menu-trigger')}>
                                        <div className={cx('select-text')}>
                                            {SORT_OPTIONS.find((opt) => opt.value === tempFilterValues.sortBy)?.title ||
                                                'Newest First'}
                                        </div>
                                        <div className={cx('select-arrow')}>
                                            <ChevronDownIcon className={cx('filter-icon')} />
                                        </div>
                                    </div>
                                </Menu>
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
            <div onClick={handleMenuClick}>
                <Tippy
                    interactive
                    visible={isVisible}
                    placement="bottom-end"
                    onClickOutside={() => setIsVisible(false)}
                    render={renderFilterContent}
                >
                    {children}
                </Tippy>
            </div>
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

            {active !== 'Orders' ? (
                <div className={cx('no-orders-container')}>
                    <div className={cx('no-orders-content')}>
                        <h3>No {active} Found</h3>
                        <p>You haven't made any {active.toLowerCase()} requests yet.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={cx('order-filter')}>
                <div className={cx('filter-item', 'search-orderId')}>
                    <button
                        onClick={handleSearchOrder}
                        className={cx('search-btn')}
                        disabled={isSearching || !orderId.trim() || !validateOrderId(orderId)}
                    >
                        <MagnifyingGlassIcon className={cx('filter-icon')} />
                    </button>
                    <input
                        type="text"
                        placeholder={isSearching ? 'Searching...' : 'Search Order ID (min 3 characters)'}
                        value={orderId}
                        onChange={handleOrderIdChange}
                        onKeyPress={handleKeyPress}
                        className={cx('search-input', { invalid: orderId && !validateOrderId(orderId) })}
                        disabled={isSearching}
                    />
                    {orderId && !isSearching && (
                        <button onClick={handleClearSearch} className={cx('clear-btn')}>
                            ×
                        </button>
                    )}
                    {error && <div className={cx('error-message')}>{error}</div>}
                </div>

                <FilterMenu>
                    <div className={cx('filter-item', 'btn-filter')}>
                        <FunnelIcon className={cx('filter-icon')} />
                        <div className={cx('filter-text')}>Filter</div>
                    </div>
                </FilterMenu>

                <div className={cx('filter-item', 'date-range')}>
                    <div className={cx('date-range-inputs')}>
                        <input
                            type="date"
                            value={filterValues.startDate}
                            onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                            className={cx('date-input')}
                            placeholder="Start Date"
                        />
                        <span className={cx('date-separator')}>to</span>
                        <input
                            type="date"
                            value={filterValues.endDate}
                            onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                            className={cx('date-input')}
                            placeholder="End Date"
                        />
                    </div>
                </div>
            </div>

            <div className={cx('orders')}>
                {orders.length === 0 ? (
                    <div className={cx('no-orders')}>
                        {orderId ? <p>No orders found with Order ID "{orderId}".</p> : <p>No orders found.</p>}
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
                                    <strong>Total:</strong> {parseFloat(order.total_amount).toFixed(0)}$
                                </p>
                                {order.points_earned > 0 && (
                                    <p>
                                        <strong>Points:</strong> {order.points_earned} 
                                        {order.points_claimed ? ' (Claimed)' : ' (Available)'}
                                    </p>
                                )}
                            </div>
                            <div className={cx('order-item', 'order-address')}>
                                <p>
                                    <strong>Address:</strong> {order.shipping_address_details?.full_address || 'No shipping address'}
                                </p>
                                {order.shipping_address_details && (
                                    <div className={cx('address-details')}>
                                        {order.shipping_address_details.note && (
                                            <p><strong>Note:</strong> {order.shipping_address_details.note}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className={cx('order-item')}>
                                <p className={cx('order-status')}>{order.status}</p>
                                <div className={cx('btn-container')}>
                                    <button className={cx('btn-detail')} onClick={() => navigate(`/order/${order.id}`)}>
                                        Detail
                                    </button>
                                    <button className={cx('btn-reorder')}>Reorder</button>
                                    {order.can_claim_points && (
                                        <button 
                                            className={cx('btn-claim-points')} 
                                            onClick={() => handleClaimPoints(order.id)}
                                        >
                                            Claim {order.points_earned} Points
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {renderPagination()}
        </>)}
    </div>
);
};

export default Order;
