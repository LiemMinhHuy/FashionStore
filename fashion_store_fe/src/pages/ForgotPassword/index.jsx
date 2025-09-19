// d:\Fashion-Store\fashion_store_fe\src\pages\ForgotPassword\index.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './ForgotPassword.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: verify, 3: reset
    const [formData, setFormData] = useState({
        email: '',
        token: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/password/forgot/', {
                email: formData.email
            });

            if (response.data.success) {
                setMessage(response.data.message);
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/password/verify-token/', {
                email: formData.email,
                token: formData.token
            });

            if (response.data.success) {
                setMessage(response.data.message);
                setStep(3);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Mã xác thực không hợp lệ.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://127.0.0.1:8000/password/reset/', {
                email: formData.email,
                token: formData.token,
                new_password: formData.newPassword,
                confirm_password: formData.confirmPassword
            });

            if (response.data.success) {
                setMessage(response.data.message);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('forgot-password-container')}>
            <div className={cx('forgot-password-card')}>
                <div className={cx('header')}>
                    <h2>Forgot Password</h2>
                    <p>
                        {step === 1 && 'Enter your email to receive verification code'}
                        {step === 2 && 'Enter 6-digit code sent to your email'}
                        {step === 3 && 'Enter your new password'}
                    </p>
                </div>

                {message && (
                    <div className={cx('message', 'success')}>
                        {message}
                    </div>
                )}

                {error && (
                    <div className={cx('message', 'error')}>
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendCode} className={cx('form')}>
                        <div className={cx('form-group')}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={cx('btn', 'btn-primary')}
                            disabled={loading}
                        >
                            {loading ? 'Send Code' : 'Send Code'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyToken} className={cx('form')}>
                        <div className={cx('form-group')}>
                            <label htmlFor="token">Verification Code</label>
                            <input
                                type="text"
                                id="token"
                                name="token"
                                value={formData.token}
                                onChange={handleInputChange}
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className={cx('form-actions')}>
                            <button
                                type="submit"
                                className={cx('btn', 'btn-primary')}
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className={cx('form')}>
                        <div className={cx('form-group')}>
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                                minLength="6"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className={cx('form-group')}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm new password"
                                minLength="6"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={cx('btn', 'btn-primary')}
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className={cx('footer')}>
                    <Link to="/login" className={cx('back-link')}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;