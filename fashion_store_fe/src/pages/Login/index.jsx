import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Login.module.scss';
import classNames from 'classnames/bind';
import * as loginService from '~/api/loginService';
import { useNavigate } from 'react-router-dom';
import { MyDispatchContext } from '~/utils/Context/context';
import { authApi } from '~/utils/request';
import { GoogleLogin } from '@react-oauth/google';
import { post as apiPost } from '~/utils/request';

const cx = classNames.bind(styles);

export default function Login() {
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
			// Store refresh token if available
			if (response.refresh_token) {
				localStorage.setItem('refresh_token', response.refresh_token);
			}

			setTimeout(async () => {
				let user = await authApi(response.access_token).get('users/current-user/');
				console.info(user.data);

				// Dispatch action để cập nhật state của người dùng
				dispatch({
					type: 'login',
					payload: user.data,
				});

				if (user.data.role === 'customer') {
					navigate('/');
				} else if (user.data.role === 'regular') {
					navigate('/admin/dashboard');
				} else {
					// Handle case where role is unknown (or invalid)
					console.error('Unknown user role', user.data.role);
					// It's recommended to implement a safe redirect or alert to the user
				}
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
					<Link to="/signup">
						<span className={cx('link')}>Sign up</span>
					</Link>
				</div>
				<div className={cx('divider')}>or</div>

				{/* Google Login với button tùy biến để chỉnh kích thước qua CSS */}
				<GoogleLogin
					onSuccess={async (credentialResponse) => {
						console.log('Google Login Success:', credentialResponse);
						const id_token = credentialResponse.credential;
						console.log('ID Token:', id_token);
						
						try {
							// Đúng endpoint: /auth/google/ (không có tiền tố api/)
							console.log('Sending token to backend...');
							const data = await apiPost('auth/google/', { id_token });
							console.log('Backend response:', data);
							localStorage.setItem('access_token', data.access_token);
							// Store refresh token if available
							if (data.refresh_token) {
								localStorage.setItem('refresh_token', data.refresh_token);
							}
							const user = await authApi(data.access_token).get('users/current-user/');
							console.log('User data:', user.data);
							dispatch({ type: 'login', payload: user.data });
							if (user.data.role === 'customer') navigate('/');
							else if (user.data.role === 'staff') navigate('/admin/dashboard');
							else if (user.data.role === 'regular') navigate('/admin/dashboard');
						} catch (err) {
							console.error('Google sign-in error:', err);
							console.error('Error response:', err.response?.data);
							console.error('Error status:', err.response?.status);
							console.error('Error headers:', err.response?.headers);
							console.error('Full error object:', JSON.stringify(err, null, 2));
							
							// Log chi tiết hơn
							if (err.response) {
								console.error('Response data:', err.response.data);
								console.error('Response status:', err.response.status);
								console.error('Response headers:', err.response.headers);
							} else if (err.request) {
								console.error('Request error:', err.request);
							} else {
								console.error('Error message:', err.message);
							}
							
							setError('Google sign-in failed: ' + (err.response?.data?.detail || err.message));
						}
					}}
					onError={(error) => {
						console.error('Google Login Failed:', error);
						setError('Google Login Failed: ' + (error.error || 'Unknown error'));
					}}
					useOneTap={false}
					render={(renderProps) => (
						<button
							className={cx('btn-google', 'lg')}
							type="button"
							onClick={() => renderProps.onClick()}
							disabled={renderProps.disabled}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
								<path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.64,6.053,29.084,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
								<path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C33.64,6.053,29.084,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
								<path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.191-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.552,5.047C9.454,39.556,16.204,44,24,44z"/>
								<path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.094,5.565 c0.001-0.001,0.002-0.001,0.003-0.002l6.191,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
							</svg>
							<p>Sign in with Google</p>
						</button>
					)}
				/>
			</form>
		</div>
	);
}
