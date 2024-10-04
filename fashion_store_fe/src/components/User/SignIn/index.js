import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SignIn.module.scss';
import classNames from 'classnames/bind';
import { GoogleIcon } from '~/Icons';
import * as loginService from '~/api/loginService';
import { useNavigate } from 'react-router-dom';
import { MyDispatchContext } from '~/utils/context';
import { authApi } from '~/utils/request';

const cx = classNames.bind(styles);

export default function SignIn() {
    const dispatch = useContext(MyDispatchContext);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const username = data.get('username');
        const password = data.get('password');

        setLoading(true);

        try {
            const response = await loginService.login(username, password);

            console.log('Login successful:', response);

            localStorage.setItem('access_token', response.access_token);

            setTimeout(async () => {
                let user = await authApi(response.access_token).get('users/current-user/');
                console.info(user.data);

                // Dispatch action để cập nhật state của người dùng
                dispatch({
                    type: 'login',
                    payload: user.data,
                });

                // Điều hướng về trang chủ
                navigate('/');
            }, 100);

            // Xóa lỗi nếu thành công
            setError(null);
        } catch (error) {
            // Xử lý lỗi đăng nhập
            console.error('Login error:', error);
            setError('Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin tài khoản và mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('avatar')}>
                <i className="fas fa-sign-in-alt"></i>
            </div>
            <h1 className={cx('title')}>Sign in</h1>
            <form onSubmit={handleSubmit} noValidate className={cx('form')}>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className={cx('input-container')}>
                    <div className={cx('label')}>
                        <label htmlFor="username">Username</label>
                    </div>
                    <input
                        placeholder="Enter your username"
                        type="text"
                        id="username"
                        name="username"
                        autoComplete="username"
                        required
                    />
                </div>
                <div className={cx('input-container')}>
                    <div className={cx('label')}>
                        <label htmlFor="password">Password</label>
                    </div>
                    <input
                        placeholder="Enter your password"
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        required
                    />
                </div>
                <div className={cx('flex')}>
                    <div className={cx('remember')}>
                        <input type="checkbox" id="remember" name="remember" />
                        <label htmlFor="remember"> Remember me</label>
                    </div>
                    <Link to="/user/forgot">
                        <p className={cx('link')}>Forgot your password?</p>
                    </Link>
                </div>
                <button type="submit" className={cx('submitButton')} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <div className={cx('signup')}>
                    <p>Don't have an account?</p>
                    <Link to="/register">
                        <span className={cx('link')}>Sign up</span>
                    </Link>
                </div>
                <div className={cx('divider')}>or</div>
                <button className={cx('btn-google')} type="button">
                    <GoogleIcon />
                    <p>Sign in with Google</p>
                </button>
            </form>
        </div>
    );
}
