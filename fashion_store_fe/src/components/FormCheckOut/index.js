import React, { useState } from 'react';
import { level1s, findLevel1ById, findById } from 'dvhcvn';
import styles from './FormCheckOut.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

const FormCheckOut = ({ onAddressChange }) => {
    const [provinceId, setProvinceId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [wardId, setWardId] = useState('');
    const [street, setStreet] = useState('');

    // Lấy danh sách tỉnh/thành
    const provinces = level1s;

    // Lấy danh sách quận/huyện theo tỉnh đã chọn
    const districts = provinceId ? findLevel1ById(provinceId)?.children || [] : [];

    // Lấy danh sách xã/phường theo quận/huyện đã chọn
    const wards = districtId ? findById(districtId)?.children || [] : [];

    const handleProvinceChange = (e) => {
        setProvinceId(e.target.value);
        setDistrictId('');
        setWardId('');
    };

    const handleDistrictChange = (e) => {
        setDistrictId(e.target.value);
        setWardId('');
    };

    const handleWardChange = (e) => {
        setWardId(e.target.value);
    };

    // Hàm tổng hợp địa chỉ
    const getFullAddress = () => {
        const province = provinceId ? findLevel1ById(provinceId)?.name : '';
        const district = districtId ? findById(districtId)?.name : '';
        const ward = wardId ? findById(wardId)?.name : '';
        return [street, ward, district, province].filter(Boolean).join(', ');
    };

    // Gọi callback mỗi khi địa chỉ thay đổi
    React.useEffect(() => {
        if (onAddressChange) {
            onAddressChange(getFullAddress());
        }
        // eslint-disable-next-line
    }, [provinceId, districtId, wardId, street]);

    return (
        <form className={cx('checkout-form')}> 
            <div className={cx('form-group')}>
                <label>Province/City</label>
                <select value={provinceId} onChange={handleProvinceChange} className={cx('input')} required>
                    <option value="">Province/city</option>
                    {provinces.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div className={cx('form-group')}>
                <label>District</label>
                <select value={districtId} onChange={handleDistrictChange} className={cx('input')} required disabled={!provinceId}>
                    <option value="">District</option>
                    {districts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
            </div>
            <div className={cx('form-group')}>
                <label>Ward</label>
                <select value={wardId} onChange={handleWardChange} className={cx('input')} required disabled={!districtId}>
                    <option value="">Ward</option>
                    {wards.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </select>
            </div>
            <div className={cx('form-group')}>
                <label>Street/House number</label>
                <input
                    type="text"
                    className={cx('input')}
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Enter street, house number"
                    required
                />
            </div>
        </form>
    );
};

export default FormCheckOut;