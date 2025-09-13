import React, { useState, useEffect, useContext } from 'react';
import { authApi } from '~/utils/request';
import styles from './Profile.module.scss';
import classNames from 'classnames/bind';
import { MyDispatchContext } from '~/utils/Context/context'; // Import dispatch context

const cx = classNames.bind(styles);

function Profile() {
    const dispatch = useContext(MyDispatchContext); // Get dispatch from context
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

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
            setAvatarPreview(response.data.avatar);
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

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size must be less than 5MB.');
                return;
            }
            
            setAvatar(file);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        console.log('Form submitted!', e);
        e.preventDefault();
        
        // Validate phone number if provided
        if (formData.phone) {
            // Check if phone number contains only valid characters
            if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
                alert('Invalid phone number. Please use only numbers, +, -, spaces and parentheses.');
                return;
            }
            
            // Remove all non-digit characters for length check
            const digitsOnly = formData.phone.replace(/\D/g, '');
            if (digitsOnly.length !== 10) {
                alert('Phone number must contain exactly 10 digits.');
                return;
            }
        }
        
        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('email', formData.email);
            submitData.append('phone', formData.phone);
            
            // Add avatar if selected
            if (avatar) {
                submitData.append('avatar', avatar);
            }
            
            const response = await authApi(localStorage.getItem('access_token')).patch('/users/current-user/', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            // Update the user state with the response data
            setUser(response.data);
            setFormData({
                first_name: response.data.first_name || '',
                last_name: response.data.last_name || '',
                email: response.data.email || '',
                phone: response.data.phone || '',
            });
            setAvatarPreview(response.data.avatar || 'https://res.cloudinary.com/ddoebyozj/image/upload/v1726042192/avartar_twah6s.jpg');
            
            // Update the context with the new user data
            dispatch({
                type: 'login',
                payload: response.data
            });
            
            setEditing(false);
            setAvatar(null); // Clear selected file
            // fetchUser(); // No need to fetch again since we already have the updated data
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
                    {/* Avatar Section */}
                    <div className={cx('avatar-section')}>
                        <div className={cx('avatar-container')}>
                            <img 
                                src={avatarPreview || 'https://res.cloudinary.com/ddoebyozj/image/upload/v1726042192/avartar_twah6s.jpg'} 
                                alt="Avatar" 
                                className={cx('avatar-image')}
                            />
                            {editing && (
                                <div className={cx('avatar-overlay')}>
                                    <input
                                        type="file"
                                        id="avatar-upload"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className={cx('avatar-input')}
                                    />
                                    <label htmlFor="avatar-upload" className={cx('avatar-upload-btn')}>
                                        <i className="fas fa-camera"></i>
                                        <span>Change Avatar</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

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
                                        setAvatar(null);
                                        setAvatarPreview(user?.avatar);
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
