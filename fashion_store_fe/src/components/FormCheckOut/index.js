import React, { useState } from 'react';
import { level1s, findLevel1ById, findById } from 'dvhcvn';
import styles from './FormCheckOut.module.scss';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';

const cx = classNames.bind(styles);

const FormCheckOut = ({ onAddressChange }) => {
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [wardId, setWardId] = useState('');
    const [street, setStreet] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [errors, setErrors] = useState({});

    // Get list of provinces/cities
    const provinces = level1s;

    // Get list of districts based on selected province
    const districts = provinceId ? findLevel1ById(provinceId)?.children || [] : [];

    // Get list of wards based on selected district
    const wards = districtId ? findById(districtId)?.children || [] : [];

    const validatePhone = (phoneNumber) => {
        if (!phoneNumber) return 'Phone number is required';
        
        // Remove all non-digit characters for validation
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        
        // Check if it has exactly 10 digits
        if (digitsOnly.length !== 10) {
            return 'Phone number must have exactly 10 digits';
        }
        
        // Check if it starts with 0 or +84
        if (!phoneNumber.startsWith('0') && !phoneNumber.startsWith('+84')) {
            return 'Phone number must start with 0 or +84';
        }
        
        return null;
    };

    const validatePostalCode = (code) => {
        if (!code) return 'Postal code is required';
        if (code.length !== 6 || !/^\d{6}$/.test(code)) {
            return 'Postal code must have exactly 6 digits';
        }
        return null;
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!fullName.trim()) newErrors.fullName = 'Full name is required';
        
        const phoneError = validatePhone(phone);
        if (phoneError) newErrors.phone = phoneError;
        
        if (!provinceId) newErrors.province = 'Please select province/city';
        if (!districtId) newErrors.district = 'Please select district';
        if (!wardId) newErrors.ward = 'Please select ward';
        if (!street.trim()) newErrors.street = 'Street address is required';
        
        const postalError = validatePostalCode(postalCode);
        if (postalError) newErrors.postalCode = postalError;
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setPhone(value);
        
        // Clear phone error when user types
        if (errors.phone) {
            setErrors(prev => ({ ...prev, phone: null }));
        }
    };

    const handlePostalCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setPostalCode(value);
            
            // Clear postal code error when user types
            if (errors.postalCode) {
                setErrors(prev => ({ ...prev, postalCode: null }));
            }
        }
    };

    const handleProvinceChange = (e) => {
        setProvinceId(e.target.value);
        setDistrictId('');
        setWardId('');
        // Clear province error
        if (errors.province) {
            setErrors(prev => ({ ...prev, province: null, district: null, ward: null }));
        }
    };

    const handleDistrictChange = (e) => {
        setDistrictId(e.target.value);
        setWardId('');
        // Clear district error
        if (errors.district) {
            setErrors(prev => ({ ...prev, district: null, ward: null }));
        }
    };

    const handleWardChange = (e) => {
        setWardId(e.target.value);
        // Clear ward error
        if (errors.ward) {
            setErrors(prev => ({ ...prev, ward: null }));
        }
    };

    const getAddressPayload = () => {
        const province = provinceId ? findLevel1ById(provinceId)?.name : '';
        const district = districtId ? findById(districtId)?.name : '';
        const ward = wardId ? findById(wardId)?.name : '';
        
        // Validate form before returning payload
        const isValid = validateForm();
        if (!isValid) {
            console.log('Form validation failed:', errors);
            return null; // Return null if validation fails
        }
        
        return {
            full_name: fullName.trim(),
            phone: phone.trim(),
            address_line1: street.trim(),
            address_line2: '',
            province,
            district,
            ward,
            postal_code: postalCode,
            country: 'Vietnam',
            is_default: false,
            is_billing: false,
            is_shipping: true,
        };
    };

    // Call callback whenever address changes
    React.useEffect(() => {
        if (onAddressChange) {
            const payload = getAddressPayload();
            onAddressChange(payload); // payload can be null if validation fails
        }
        // eslint-disable-next-line
    }, [fullName, phone, provinceId, districtId, wardId, street, postalCode]);

    return (
        <form className={cx('checkout-form')}> 
            <div className={cx('form-group')}>
                <label>Full name</label>
                <input
                    type="text"
                    className={cx('input', { error: errors.fullName })}
                    value={fullName}
                    onChange={e => {
                        setFullName(e.target.value);
                        if (errors.fullName) {
                            setErrors(prev => ({ ...prev, fullName: null }));
                        }
                    }}
                    placeholder="Enter your full name"
                    required
                />
                {errors.fullName && <div className={cx('error-message')}>{errors.fullName}</div>}
            </div>
            <div className={cx('form-group')}>
                <label>Phone</label>
                <input
                    type="tel"
                    className={cx('input', { error: errors.phone })}
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter your phone number (e.g., 0901234567)"
                    required
                />
                {errors.phone && <div className={cx('error-message')}>{errors.phone}</div>}
            </div>
            <div className={cx('form-group')}>
                <label>Province/City</label>
                <select 
                    value={provinceId} 
                    onChange={handleProvinceChange} 
                    className={cx('input', { error: errors.province })} 
                    required
                >
                    <option value="">Province/city</option>
                    {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {errors.province && <div className={cx('error-message')}>{errors.province}</div>}
            </div>
            <div className={cx('form-group')}>
                <label>District</label>
                <select 
                    value={districtId} 
                    onChange={handleDistrictChange} 
                    className={cx('input', { error: errors.district })} 
                    required 
                    disabled={!provinceId}
                >
                    <option value="">District</option>
                    {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
                {errors.district && <div className={cx('error-message')}>{errors.district}</div>}
            </div>
            <div className={cx('form-group')}>
                <label>Ward</label>
                <select 
                    value={wardId} 
                    onChange={handleWardChange} 
                    className={cx('input', { error: errors.ward })} 
                    required 
                    disabled={!districtId}
                >
                    <option value="">Ward</option>
                    {wards.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
                {errors.ward && <div className={cx('error-message')}>{errors.ward}</div>}
            </div>
            <div className={cx('form-group')}>
                <label>Street/House number</label>
                <input
                    type="text"
                    className={cx('input', { error: errors.street })}
                    value={street}
                    onChange={e => {
                        setStreet(e.target.value);
                        if (errors.street) {
                            setErrors(prev => ({ ...prev, street: null }));
                        }
                    }}
                    placeholder="Enter street, house number"
                    required
                />
                {errors.street && <div className={cx('error-message')}>{errors.street}</div>}
            </div>
            <div className={cx('form-group')}>
                <label>Postal code (6 digits)</label>
                <input
                    type="text"
                    className={cx('input', { error: errors.postalCode })}
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                    placeholder="Enter 6-digit postal code"
                    maxLength={6}
                    required
                />
                {errors.postalCode && <div className={cx('error-message')}>{errors.postalCode}</div>}
            </div>
        </form>
    );
};

export default FormCheckOut;