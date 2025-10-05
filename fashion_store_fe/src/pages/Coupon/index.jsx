import React, { useState, useEffect } from 'react';
import { getAuthApi } from '~/utils/request';
import styles from './Coupon.module.scss';
import classNames from 'classnames/bind';
import {
    GiftIcon,
    TicketIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Barcode from 'react-barcode';


const cx = classNames.bind(styles);

// API endpoints
const COUPON_API = {
    myCoupons: '/coupons/my-coupons/',
    claimCoupon: '/coupons/claim/',
};

function Coupon() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [couponCode, setCouponCode] = useState('');

    const fetchMyCoupons = async () => {
        try {
            setLoading(true);
            setError(null);

            const authApiInstance = getAuthApi();
            const response = await authApiInstance.get(COUPON_API.myCoupons);
            setCoupons(response.data?.results || response.data || []);
        } catch (error) {
            console.error('Error fetching my coupons:', error);
            setError('Failed to load your coupons. Please try again later.');
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCoupons();
    }, []);

    const handleClaimCoupon = async (e) => {
        e.preventDefault();

        if (!couponCode.trim()) {
            setError('Please enter a coupon code');
            return;
        }

        setClaiming(true);
        setError(null);

        try {
            const authApiInstance = getAuthApi();
            await authApiInstance.post(COUPON_API.claimCoupon, {
                code: couponCode.trim().toUpperCase(),
            });

            setSuccessMessage('Coupon claimed successfully!');
            setCouponCode('');
            setShowClaimForm(false);
            await fetchMyCoupons();

            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error claiming coupon:', error);
            const errorMessage =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to claim coupon. Please check the code and try again.';
            setError(errorMessage);
        } finally {
            setClaiming(false);
        }
    };

    const resetClaimForm = () => {
        setCouponCode('');
        setShowClaimForm(false);
        setClaiming(false);
        setError(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isExpired = (validUntil) => {
        return new Date(validUntil) < new Date();
    };

    const isFullyUsed = (usedCount, usageLimit, usedByCustomer, limitPerCustomer) => {
        return (usageLimit && usedCount >= usageLimit) || (limitPerCustomer && usedByCustomer >= limitPerCustomer);
    };

    if (loading) {
        return <div className={cx('loading')}>Loading your coupons...</div>;
    }

    return (
        <div className={cx('coupon-container')}>
            {successMessage && (
                <div className={cx('success-message')}>
                    <CheckCircleIcon className={cx('success-icon')} />
                    {successMessage}
                </div>
            )}

            <div className={cx('header')}>
                <h1 className={cx('title')}>My Coupons</h1>
                <button className={cx('btn-add')} onClick={() => setShowClaimForm(true)}>
                    <GiftIcon className={cx('icon')} />
                    Claim Coupon
                </button>
            </div>

            {showClaimForm && (
                <div className={cx('form-overlay')} onClick={(e) => e.target === e.currentTarget && resetClaimForm()}>
                    <div className={cx('form-card')}>
                        <div className={cx('form-header')}>
                            <h2>Claim Coupon</h2>
                            <button type="button" className={cx('btn-close')} onClick={resetClaimForm}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleClaimCoupon} className={cx('coupon-form')}>
                            {error && (
                                <div className={cx('error-message')}>
                                    <ExclamationTriangleIcon className={cx('error-icon')} />
                                    {error}
                                </div>
                            )}

                            <div className={cx('claim-form-content')}>
                                <div className={cx('claim-icon')}>
                                    <GiftIcon className={cx('gift-icon')} />
                                </div>
                                <h3>Enter Coupon Code</h3>
                                <p>Enter the coupon code to add it to your account</p>

                                <div className={cx('form-group')}>
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        required
                                        className={cx('form-input', 'coupon-code-input')}
                                        placeholder="Enter coupon code (e.g., SUMMER20)"
                                        disabled={claiming}
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            <div className={cx('form-actions')}>
                                <button
                                    type="submit"
                                    className={cx('btn-save')}
                                    disabled={claiming || !couponCode.trim()}
                                >
                                    {claiming ? 'Getting...' : 'Get Coupon'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetClaimForm}
                                    className={cx('btn-cancel')}
                                    disabled={claiming}
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
                        <p>Claim your first coupon to start saving money</p>
                        <button className={cx('btn-add-empty')} onClick={() => setShowClaimForm(true)}>
                            Claim Coupon
                        </button>
                    </div>
                ) : (
                    coupons.map((coupon) => (
                        <div
                            key={coupon.id}
                            className={cx('coupon-item', {
                                disabled:
                                    !coupon.is_active ||
                                    isExpired(coupon.valid_until) ||
                                    isFullyUsed(
                                        coupon.used_count || 0,
                                        coupon.usage_limit,
                                        coupon.used_by_customer || 0,
                                        coupon.usage_limit_per_customer,
                                    ),
                            })}
                        >
                            {/* Left Section - Rotated "Enjoy Your Gift" */}
                            <div className={cx('coupon-left')}>
                                <div className={cx('coupon-code')}> {coupon.code}</div>
                            </div>

                            {/* Center Section - Main Content */}
                            <div className={cx('coupon-center')}>
                                <div className={cx('coupon-content')}>
                                    <h2>
                                        {coupon.discount_type === 'percentage'
                                            ? `${parseFloat(coupon.discount_value).toFixed(0)}% OFF`
                                            : coupon.discount_type === 'free_shipping'
                                            ? 'FREE SHIPPING'
                                            : `$${parseFloat(coupon.discount_value).toFixed(0)} OFF`}
                                    </h2>
                                    <h3>Coupon</h3>
                                    <small>Valid until {formatDate(coupon.valid_until)}</small>
                                </div>
                            </div>

                            {/* Right Section - Coupon Code */}
                            <div className={cx('coupon-right')}>
                                <div className={cx('barcode-container')}>
                                    <div className={cx('barcode')}>
                                        <Barcode
                                            value={`${coupon.id + 7878521112}`}
                                            width={1.2}
                                            height={40}
                                            fontSize={10}
                                            background="transparent"
                                            lineColor="#1a202c"
                                            displayValue={false}
                                            format="CODE128"
                                        />
                                    </div>
                                    <div className={cx('barcode-text')}>{coupon.id + 7878521112}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Coupon;
