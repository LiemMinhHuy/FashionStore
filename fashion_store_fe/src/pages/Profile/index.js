import React, { useState, useEffect } from 'react';
import { authApi } from '~/utils/request';
import styles from './Profile.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });

    const fetchUser = async () => {
        try {
            const response = await authApi(localStorage.getItem('access_token')).get('/users/current-user/');
            setUser(response.data);
            setFormData({
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
            });
        } catch (error) {
            console.log('Error fetching user:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        console.log('Form submitted!', e);
        e.preventDefault();
        
        // Validate phone number if provided
        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            alert('Invalid phone number. Please use only numbers, +, -, spaces and parentheses.');
            return;
        }
        
        try {
            await authApi(localStorage.getItem('access_token')).patch('/users/current-user/', formData);
            setEditing(false);
            fetchUser(); // Refresh user data
        } catch (error) {
            console.log('Error updating profile:', error);
            alert('An error occurred while updating profile. Please try again.');
        }
    };

    const handleEditClick = (e) => {
        e.preventDefault();
        console.log('Edit button clicked, current editing state:', editing);
        setEditing(true);
        console.log('Editing state set to true');
    };

    if (loading) {
        return <div className={cx('loading')}>Loading...</div>;
    }

    return (
        <div className={cx('profile-container')}>
            <h1 className={cx('title')}>Profile</h1>

            <div className={cx('profile-card')}>
                <form onSubmit={handleSubmit} className={cx('profile-form')}>
                    <div className={cx('name-group')}>
                        <div className={cx('form-group')}>
                            <label htmlFor="first_name">First Name</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                disabled={!editing}
                                className={cx('form-input')}
                            />
                        </div>
                        <div className={cx('form-group')}>
                            <label htmlFor="last_name">Last Name</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                disabled={!editing}
                                className={cx('form-input')}
                            />
                        </div>
                    </div>

                    <div className={cx('form-group')}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!editing}
                            className={cx('form-input')}
                        />
                    </div>

                    <div className={cx('form-group')}>
                        <label htmlFor="phone">Phone</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!editing}
                            className={cx('form-input')}
                            placeholder="Enter phone number (e.g., 0123456789 or +84123456789)"
                        />
                    </div>

                    <div className={cx('form-actions')}>
                        {!editing ? (
                            <button type="button" onClick={handleEditClick} className={cx('btn-edit')}>
                                Edit Profile
                            </button>
                        ) : (
                            <>
                                <button type="submit" className={cx('btn-save')}>
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            first_name: user?.first_name || '',
                                            last_name: user?.last_name || '',
                                            email: user?.email || '',
                                            phone: user?.phone || '',
                                        });
                                    }}
                                    className={cx('btn-cancel')}
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
            {console.log('Current editing state:', editing)}
        </div>
    );
}

export default Profile;
