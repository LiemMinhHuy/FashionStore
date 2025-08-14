import React, { useState, useEffect } from 'react';
import { authApi } from '~/utils/request';
import styles from './Coupon.module.scss';
import classNames from 'classnames/bind';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    TicketIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const cx = classNames.bind(styles);

function Coupon() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discount_type: 'percentage', // percentage or fixed
        discount_value: '',
        min_order_amount: '',
        max_discount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true,
    });

    const fetchCoupons = async () => {
        try {
            setError(null);
            // Sử dụng mock data để demo
            const mockCoupons = [
                {
                    id: 1,
                    code: 'SUMMER20',
                    description: 'Giảm 20% cho mùa hè',
                    discount_type: 'percentage',
                    discount_value: 20,
                    min_order_amount: 500000,
                    max_discount: 200000,
                    usage_limit: 100,
                    used_count: 45,
                    valid_from: '2024-06-01',
                    valid_until: '2024-08-31',
                    is_active: true,
                    created_at: '2024-05-15'
                },
                {
                    id: 2,
                    code: 'NEWCUSTOMER',
                    description: 'Giảm 50k cho khách hàng mới',
                    discount_type: 'fixed',
                    discount_value: 50000,
                    min_order_amount: 200000,
                    max_discount: 50000,
                    usage_limit: 50,
                    used_count: 12,
                    valid_from: '2024-01-01',
                    valid_until: '2024-12-31',
                    is_active: true,
                    created_at: '2024-01-01'
                },
                {
                    id: 3,
                    code: 'FLASH30',
                    description: 'Flash sale giảm 30%',
                    discount_type: 'percentage',
                    discount_value: 30,
                    min_order_amount: 300000,
                    max_discount: 300000,
                    usage_limit: 200,
                    used_count: 200,
                    valid_from: '2024-05-01',
                    valid_until: '2024-05-31',
                    is_active: false,
                    created_at: '2024-04-25'
                }
            ];
            setCoupons(mockCoupons);
        } catch (error) {
            console.log('Error fetching coupons:', error);
            setError('Failed to load coupons. Please try again later.');
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: '',
            min_order_amount: '',
            max_discount: '',
            usage_limit: '',
            valid_from: '',
            valid_until: '',
            is_active: true,
        });
        setEditingCoupon(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCoupon) {
                // Update existing coupon
                console.log('Updating coupon:', formData);
            } else {
                // Create new coupon
                console.log('Creating new coupon:', formData);
            }
            resetForm();
            fetchCoupons();
        } catch (error) {
            console.log('Error saving coupon:', error);
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            min_order_amount: coupon.min_order_amount.toString(),
            max_discount: coupon.max_discount.toString(),
            usage_limit: coupon.usage_limit.toString(),
            valid_from: coupon.valid_from,
            valid_until: coupon.valid_until,
            is_active: coupon.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (couponId) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                console.log('Deleting coupon:', couponId);
                fetchCoupons();
            } catch (error) {
                console.log('Error deleting coupon:', error);
            }
        }
    };

    const handleToggleActive = async (couponId, currentStatus) => {
        try {
            console.log('Toggling coupon status:', couponId, !currentStatus);
            fetchCoupons();
        } catch (error) {
            console.log('Error toggling coupon status:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const isExpired = (validUntil) => {
        return new Date(validUntil) < new Date();
    };

    const isFullyUsed = (usedCount, usageLimit) => {
        return usedCount >= usageLimit;
    };

    if (loading) {
        return <div className={cx('loading')}>Loading coupons...</div>;
    }

    if (error) {
        return (
            <div className={cx('coupon-container')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>Coupons</h1>
                </div>
                <div className={cx('error-state')}>
                    <h3>Error Loading Coupons</h3>
                    <p>{error}</p>
                    <button 
                        className={cx('btn-retry')}
                        onClick={fetchCoupons}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('coupon-container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Coupons</h1>
                <button 
                    className={cx('btn-add')}
                    onClick={() => setShowForm(true)}
                >
                    <PlusIcon className={cx('icon')} />
                    Add New Coupon
                </button>
            </div>

            {showForm && (
                <div className={cx('form-overlay')}>
                    <div className={cx('form-card')}>
                        <div className={cx('form-header')}>
                            <h2>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h2>
                            <button 
                                className={cx('btn-close')}
                                onClick={resetForm}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={cx('coupon-form')}>
                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="code">Coupon Code *</label>
                                    <input
                                        type="text"
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                        placeholder="e.g., SUMMER20"
                                    />
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="discount_type">Discount Type *</label>
                                    <select
                                        id="discount_type"
                                        name="discount_type"
                                        value={formData.discount_type}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (VND)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={cx('form-group')}>
                                <label htmlFor="description">Description *</label>
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    className={cx('form-input')}
                                    placeholder="Brief description of the coupon"
                                />
                            </div>

                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="discount_value">Discount Value *</label>
                                    <div className={cx('input-with-icon')}>
                                        <CurrencyDollarIcon className={cx('input-icon')} />
                                        <input
                                            type="number"
                                            id="discount_value"
                                            name="discount_value"
                                            value={formData.discount_value}
                                            onChange={handleInputChange}
                                            required
                                            className={cx('form-input')}
                                            placeholder={formData.discount_type === 'percentage' ? '20' : '50000'}
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="min_order_amount">Minimum Order Amount *</label>
                                    <div className={cx('input-with-icon')}>
                                        <CurrencyDollarIcon className={cx('input-icon')} />
                                        <input
                                            type="number"
                                            id="min_order_amount"
                                            name="min_order_amount"
                                            value={formData.min_order_amount}
                                            onChange={handleInputChange}
                                            required
                                            className={cx('form-input')}
                                            placeholder="200000"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="max_discount">Maximum Discount</label>
                                    <div className={cx('input-with-icon')}>
                                        <CurrencyDollarIcon className={cx('input-icon')} />
                                        <input
                                            type="number"
                                            id="max_discount"
                                            name="max_discount"
                                            value={formData.max_discount}
                                            onChange={handleInputChange}
                                            className={cx('form-input')}
                                            placeholder="200000"
                                            min="0"
                                        />
                                    </div>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="usage_limit">Usage Limit</label>
                                    <input
                                        type="number"
                                        id="usage_limit"
                                        name="usage_limit"
                                        value={formData.usage_limit}
                                        onChange={handleInputChange}
                                        className={cx('form-input')}
                                        placeholder="100"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="valid_from">Valid From *</label>
                                    <div className={cx('input-with-icon')}>
                                        <CalendarIcon className={cx('input-icon')} />
                                        <input
                                            type="date"
                                            id="valid_from"
                                            name="valid_from"
                                            value={formData.valid_from}
                                            onChange={handleInputChange}
                                            required
                                            className={cx('form-input')}
                                        />
                                    </div>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="valid_until">Valid Until *</label>
                                    <div className={cx('input-with-icon')}>
                                        <CalendarIcon className={cx('input-icon')} />
                                        <input
                                            type="date"
                                            id="valid_until"
                                            name="valid_until"
                                            value={formData.valid_until}
                                            onChange={handleInputChange}
                                            required
                                            className={cx('form-input')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={cx('form-checkbox')}>
                                <label className={cx('checkbox-label')}>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className={cx('checkbox')}
                                    />
                                    Active
                                </label>
                            </div>

                            <div className={cx('form-actions')}>
                                <button type="submit" className={cx('btn-save')}>
                                    {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={resetForm}
                                    className={cx('btn-cancel')}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={cx('coupons-grid')}>
                {coupons.length === 0 ? (
                    <div className={cx('empty-state')}>
                        <TicketIcon className={cx('empty-icon')} />
                        <h3>No coupons yet</h3>
                        <p>Create your first coupon to start offering discounts</p>
                        <button 
                            className={cx('btn-add-empty')}
                            onClick={() => setShowForm(true)}
                        >
                            Add Coupon
                        </button>
                    </div>
                ) : (
                    coupons.map((coupon) => (
                        <div key={coupon.id} className={cx('coupon-card', { 
                            inactive: !coupon.is_active,
                            expired: isExpired(coupon.valid_until),
                            fullyUsed: isFullyUsed(coupon.used_count, coupon.usage_limit)
                        })}>
                            <div className={cx('coupon-header')}>
                                <div className={cx('coupon-code')}>
                                    <TicketIcon className={cx('coupon-icon')} />
                                    <span className={cx('code-text')}>{coupon.code}</span>
                                </div>
                                <div className={cx('coupon-actions')}>
                                    <button 
                                        onClick={() => handleEdit(coupon)}
                                        className={cx('btn-edit')}
                                        title="Edit"
                                    >
                                        <PencilIcon className={cx('icon')} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(coupon.id)}
                                        className={cx('btn-delete')}
                                        title="Delete"
                                    >
                                        <TrashIcon className={cx('icon')} />
                                    </button>
                                </div>
                            </div>

                            <div className={cx('coupon-content')}>
                                <h3 className={cx('coupon-description')}>{coupon.description}</h3>
                                
                                <div className={cx('coupon-details')}>
                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Discount:</span>
                                        <span className={cx('detail-value', 'discount')}>
                                            {coupon.discount_type === 'percentage' 
                                                ? `${coupon.discount_value}%` 
                                                : formatCurrency(coupon.discount_value)
                                            }
                                        </span>
                                    </div>
                                    
                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Min Order:</span>
                                        <span className={cx('detail-value')}>
                                            {formatCurrency(coupon.min_order_amount)}
                                        </span>
                                    </div>

                                    {coupon.max_discount && (
                                        <div className={cx('detail-item')}>
                                            <span className={cx('detail-label')}>Max Discount:</span>
                                            <span className={cx('detail-value')}>
                                                {formatCurrency(coupon.max_discount)}
                                            </span>
                                        </div>
                                    )}

                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Usage:</span>
                                        <span className={cx('detail-value')}>
                                            {coupon.used_count}/{coupon.usage_limit}
                                        </span>
                                    </div>

                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Valid:</span>
                                        <span className={cx('detail-value')}>
                                            {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_until)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('coupon-footer')}>
                                <div className={cx('coupon-status')}>
                                    {!coupon.is_active && (
                                        <span className={cx('status-badge', 'inactive')}>
                                            <XCircleIcon className={cx('status-icon')} />
                                            Inactive
                                        </span>
                                    )}
                                    {isExpired(coupon.valid_until) && (
                                        <span className={cx('status-badge', 'expired')}>
                                            <XCircleIcon className={cx('status-icon')} />
                                            Expired
                                        </span>
                                    )}
                                    {isFullyUsed(coupon.used_count, coupon.usage_limit) && (
                                        <span className={cx('status-badge', 'fully-used')}>
                                            <XCircleIcon className={cx('status-icon')} />
                                            Fully Used
                                        </span>
                                    )}
                                    {coupon.is_active && !isExpired(coupon.valid_until) && !isFullyUsed(coupon.used_count, coupon.usage_limit) && (
                                        <span className={cx('status-badge', 'active')}>
                                            <CheckCircleIcon className={cx('status-icon')} />
                                            Active
                                        </span>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={() => handleToggleActive(coupon.id, coupon.is_active)}
                                    className={cx('btn-toggle', { active: coupon.is_active })}
                                >
                                    {coupon.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Coupon;
