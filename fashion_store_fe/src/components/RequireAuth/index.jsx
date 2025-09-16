import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './RequireAuth.module.scss';

const cx = classNames.bind(styles);

export default function RequireAuth({ onClose }) {
    const navigate = useNavigate();

    const handleLogin = () => {
        if (onClose) onClose();
        navigate('/login');
    };

    return (
        <div className={cx('require-auth-container')}>
            <div className={cx('require-auth-content')}>
                <h2 className={cx('auth-title')}>Authentication Required</h2>
                    <button className={cx('login-btn')} onClick={handleLogin}>
                        Login
                    </button>
            </div>
        </div>
    );
}
