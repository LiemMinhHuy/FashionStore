import React, { useState, useEffect } from 'react';
import { getAuthApi } from '~/utils/request';
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

// API endpoints
const COUPON_API = {
    list: '/coupons/',
    create: '/coupons/',
    update: (id) => `/coupons/${id}/`,
    delete: (id) => `/coupons/${id}/`,
    assignToCustomer: (id) => `/coupons/${id}/assign-to-customer/`,
    myCoupons: '/coupons/my-coupons/',
    validate: '/coupons/validate/'
};

function Coupon() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        max_discount_amount: '',
        min_order_amount: '',
        usage_limit: '',
        usage_limit_per_customer: '1',
        valid_from: '',
        valid_until: '',
        coupon_type: 'public',
        is_active: true,
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const authApiInstance = getAuthApi();
            const response = await authApiInstance.get(COUPON_API.list);
            setCoupons(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
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
            name: '',
            description: '',
            discount_type: 'percentage',
            discount_value: '',
            max_discount_amount: '',
            min_order_amount: '',
            usage_limit: '',
            usage_limit_per_customer: '1',
            valid_from: '',
            valid_until: '',
            coupon_type: 'public',
            is_active: true,
        });
        setEditingCoupon(null);
        setShowForm(false);
        setSubmitting(false);
        setError(null);
        setSuccessMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            // Prepare data for API
            const apiData = {
                ...formData,
                discount_value: parseFloat(formData.discount_value),
                min_order_amount: parseFloat(formData.min_order_amount) || 0,
                max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                usage_limit_per_customer: parseInt(formData.usage_limit_per_customer) || 1,
            };
            
            const authApiInstance = getAuthApi();
            
            if (editingCoupon) {
                // Update existing coupon
                await authApiInstance.put(COUPON_API.update(editingCoupon.id), apiData);
                setSuccessMessage('Coupon updated successfully!');
            } else {
                // Create new coupon
                await authApiInstance.post(COUPON_API.create, apiData);
                setSuccessMessage('Coupon created successfully!');
            }
            
            resetForm();
            await fetchCoupons();
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error saving coupon:', error);
            setError(error.response?.data?.detail || 'Failed to save coupon. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            name: coupon.name || '',
            description: coupon.description,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value.toString(),
            max_discount_amount: coupon.max_discount_amount ? coupon.max_discount_amount.toString() : '',
            min_order_amount: coupon.min_order_amount.toString(),
            usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : '',
            usage_limit_per_customer: coupon.usage_limit_per_customer.toString(),
            valid_from: new Date(coupon.valid_from).toISOString().split('T')[0],
            valid_until: new Date(coupon.valid_until).toISOString().split('T')[0],
            coupon_type: coupon.coupon_type || 'public',
            is_active: coupon.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (couponId) => {
        if (window.confirm('Are you sure you want to delete this coupon?')) {
            try {
                const authApiInstance = getAuthApi();
                await authApiInstance.delete(COUPON_API.delete(couponId));
                console.log('Coupon deleted successfully');
                await fetchCoupons();
            } catch (error) {
                console.error('Error deleting coupon:', error);
                setError('Failed to delete coupon. Please try again.');
            }
        }
    };

    const handleToggleActive = async (couponId, currentStatus) => {
        try {
            const coupon = coupons.find(c => c.id === couponId);
            if (!coupon) return;
            
            const updatedData = {
                ...coupon,
                is_active: !currentStatus
            };
            
            const authApiInstance = getAuthApi();
            await authApiInstance.put(COUPON_API.update(couponId), updatedData);
            console.log('Coupon status updated successfully');
            await fetchCoupons();
        } catch (error) {
            console.error('Error toggling coupon status:', error);
            setError('Failed to update coupon status. Please try again.');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US');
    };

    const isExpired = (validUntil) => {
        return new Date(validUntil) < new Date();
    };

    const isFullyUsed = (usedCount, usageLimit) => {
        return usageLimit && usedCount >= usageLimit;
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

            {/* Success Message */}
            {successMessage && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #c3e6cb'
                }}>
                    {successMessage}
                    <button 
                        onClick={() => setSuccessMessage(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            float: 'right',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#155724'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    {error}
                    <button 
                        onClick={() => setError(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            float: 'right',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#721c24'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

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
                                    <label htmlFor="name">Coupon Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                        placeholder="e.g., Summer Sale"
                                    />
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
                                        <option value="fixed_amount">Fixed Amount (USD)</option>
                                        <option value="free_shipping">Free Shipping</option>
                                    </select>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="coupon_type">Coupon Type *</label>
                                    <select
                                        id="coupon_type"
                                        name="coupon_type"
                                        value={formData.coupon_type}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                        <option value="first_time">First Time Customer</option>
                                        <option value="loyalty">Loyalty Reward</option>
                                    </select>
                                </div>
                            </div>

                            {formData.discount_type !== 'free_shipping' && (
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
                                                placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                                                min="0"
                                                step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                                                max={formData.discount_type === 'percentage' ? '100' : undefined}
                                            />
                                        </div>
                                    </div>
                                    {formData.discount_type === 'percentage' && (
                                        <div className={cx('form-group')}>
                                            <label htmlFor="max_discount_amount">Maximum Discount Amount</label>
                                            <div className={cx('input-with-icon')}>
                                                <CurrencyDollarIcon className={cx('input-icon')} />
                                                <input
                                                    type="number"
                                                    id="max_discount_amount"
                                                    name="max_discount_amount"
                                                    value={formData.max_discount_amount}
                                                    onChange={handleInputChange}
                                                    className={cx('form-input')}
                                                    placeholder="200"
                                                    min="0"
                                                    step="1"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={cx('form-row')}>
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
                                            placeholder="200"
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="usage_limit">Total Usage Limit</label>
                                    <input
                                        type="number"
                                        id="usage_limit"
                                        name="usage_limit"
                                        value={formData.usage_limit}
                                        onChange={handleInputChange}
                                        className={cx('form-input')}
                                        placeholder="100 (empty = unlimited)"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="usage_limit_per_customer">Usage Limit Per Customer *</label>
                                    <input
                                        type="number"
                                        id="usage_limit_per_customer"
                                        name="usage_limit_per_customer"
                                        value={formData.usage_limit_per_customer}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                        placeholder="1"
                                        min="1"
                                    />
                                </div>
                                <div className={cx('form-group')}>
                                    {/* Empty cell for layout */}
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
                                <button 
                                    type="submit" 
                                    className={cx('btn-save')}
                                    disabled={submitting}
                                >
                                    {submitting 
                                        ? (editingCoupon ? 'Updating...' : 'Creating...') 
                                        : (editingCoupon ? 'Update Coupon' : 'Add Coupon')
                                    }
                                </button>
                                <button 
                                    type="button" 
                                    onClick={resetForm}
                                    className={cx('btn-cancel')}
                                    disabled={submitting}
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
                            fullyUsed: isFullyUsed(coupon.used_count || 0, coupon.usage_limit)
                        })}>
                            <div className={cx('coupon-header')}>
                                <div className={cx('coupon-code')}>
                                    <TicketIcon className={cx('coupon-icon')} />
                                    <span className={cx('code-text')}>{coupon.code}</span>
                                </div>
                                {/* <div className={cx('coupon-actions')}>
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
                                </div> */}
                            </div>

                            <div className={cx('coupon-content')}>
                                <h3 className={cx('coupon-description')}>{coupon.name || coupon.description}</h3>
                                <p style={{fontSize: '1.3rem', color: '#666', marginBottom: '15px'}}>{coupon.description}</p>
                                
                                <div className={cx('coupon-details')}>
                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Type:</span>
                                        <span className={cx('detail-value')}>
                                            {coupon.coupon_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Public'}
                                        </span>
                                    </div>
                                    
                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Discount:</span>
                                        <span className={cx('detail-value', 'discount')}>
                                            {coupon.discount_type === 'percentage' 
                                                ? `${coupon.discount_value}%` 
                                                : coupon.discount_type === 'free_shipping'
                                                ? 'Free Shipping'
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

                                    {coupon.max_discount_amount && (
                                        <div className={cx('detail-item')}>
                                            <span className={cx('detail-label')}>Max Discount:</span>
                                            <span className={cx('detail-value')}>
                                                {formatCurrency(coupon.max_discount_amount)}
                                            </span>
                                        </div>
                                    )}

                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Usage:</span>
                                        <span className={cx('detail-value')}>
                                            {coupon.used_count || 0}/{coupon.usage_limit || '∞'}
                                        </span>
                                    </div>

                                    <div className={cx('detail-item')}>
                                        <span className={cx('detail-label')}>Per Customer:</span>
                                        <span className={cx('detail-value')}>
                                            {coupon.usage_limit_per_customer || 1} use(s)
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
                                    {isFullyUsed(coupon.used_count || 0, coupon.usage_limit) && (
                                        <span className={cx('status-badge', 'fully-used')}>
                                            <XCircleIcon className={cx('status-icon')} />
                                            Fully Used
                                        </span>
                                    )}
                                    {coupon.is_active && !isExpired(coupon.valid_until) && !isFullyUsed(coupon.used_count || 0, coupon.usage_limit) && (
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
