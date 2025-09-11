import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './SignUp.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';

const cx = classNames.bind(styles);

export default function SignUp() {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        // Tạo đối tượng JSON để gửi
        const userData = {
            first_name: firstName,
            last_name: lastName,
            username: username,
            email: email,
            password: password,
            role: 'customer',
            // Không gửi avatar
        };

        try {
            // Gửi yêu cầu POST đến API
            await axios.post('http://127.0.0.1:8000/users/', userData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // Đăng ký thành công, chuyển hướng đến trang đăng nhập
            navigate('/login');
        } catch (error) {
            if (error.response) {
                const errorMessage = error.response.data?.detail || 'Đã xảy ra lỗi!';
                setError(errorMessage);
            } else {
                setError('Đã xảy ra lỗi kết nối!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cx('container')}>
            <div className={cx('avatar')}>
                <i className="fas fa-user-plus"></i> {/* Thay icon nếu cần */}
            </div>
            <h1 className={cx('title')}>Sign Up</h1>
            <form onSubmit={handleSubmit} className={cx('form')}>
                {error && <p className={cx('error')}>{error}</p>}
                <div className={cx('input-container')}>
                    <input
                        type="text"
                        name="first_name"
                        placeholder="First Name"
                        className={cx('input')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>
                <div className={cx('input-container')}>
                    <input
                        type="text"
                        name="last_name"
                        placeholder="Last Name"
                        className={cx('input')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>
                <div className={cx('input-container')}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        className={cx('input')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className={cx('input-container')}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className={cx('input')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className={cx('input-container')}>
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className={cx('input')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className={cx('submitButton')} disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                <div className={cx('signin')}>
                    <p>Already have an account?</p>
                    <Link to="/login" className={cx('link')}>
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    );
}
