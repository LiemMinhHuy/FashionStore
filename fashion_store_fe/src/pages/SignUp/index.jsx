import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './SignUp.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';
import Alert from '~/components/Alert';

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

        // Create JSON object to send
        const userData = {
            first_name: firstName,
            last_name: lastName,
            username: username,
            email: email,
            password: password,
            role: 'customer',
            // Don't send avatar
        };

        try {
            // Send POST request to API
            await axios.post('http://127.0.0.1:8000/users/', userData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            // Registration successful, redirect to login page
            navigate('/login');
        } catch (error) {
            if (error.response) {
                // Handle specific error cases
                if (error.response.data) {
                    // Check for specific field errors
                    if (error.response.data.username) {
                        setError(`Username error: ${error.response.data.username[0]}`);
                    } else if (error.response.data.email) {
                        setError(`Email error: ${error.response.data.email[0]}`);
                    } else if (error.response.data.password) {
                        setError(`Password error: ${error.response.data.password[0]}`);
                    } else if (error.response.data.first_name) {
                        setError(`First name error: ${error.response.data.first_name[0]}`);
                    } else if (error.response.data.last_name) {
                        setError(`Last name error: ${error.response.data.last_name[0]}`);
                    } else if (error.response.data.detail) {
                        setError(error.response.data.detail);
                    } else {
                        setError('Registration failed. Please check your information and try again.');
                    }
                } else {
                    setError('An error occurred during registration!');
                }
            } else {
                setError('Connection error occurred! Please check your internet connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAlert = () => {
        setError(null);
    };

    return (
        <div className={cx('container')}>
            <div className={cx('avatar')}>
                <i className="fas fa-user-plus"></i> {/* Replace icon if needed */}
            </div>
            <h1 className={cx('title')}>Sign Up</h1>
            {error && <Alert type="error" message={error} />}
            <form onSubmit={handleSubmit} className={cx('form')}>
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
