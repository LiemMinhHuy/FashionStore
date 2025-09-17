import React, { useState, useEffect } from 'react';
import { authApi } from '~/utils/request';
import styles from './Address.module.scss';
import classNames from 'classnames/bind';
import { PlusIcon, PencilIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import AddressForm from '~/components/AddressForm';

const cx = classNames.bind(styles);

function Address() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        province: '',
        district: '',
        ward: '',
        postal_code: '',
        is_default: false,
        is_billing: false,
        is_shipping: true,
        note: '',
    });

    const fetchAddresses = async () => {
        try {
            setError(null);
            const response = await authApi(localStorage.getItem('access_token')).get('/addresses/');
            
            // Kiểm tra cấu trúc dữ liệu trả về
            if (Array.isArray(response.data)) {
                setAddresses(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                setAddresses(response.data.results);
            } else {
                setAddresses([]);
                console.log('Unexpected data structure:', response.data);
            }
        } catch (error) {
            console.log('Error fetching addresses:', error);
            // Sử dụng mock data để test giao diện
            const mockAddresses = [
                {
                    id: 1,
                    full_name: 'Nguyễn Văn A',
                    phone: '0123456789',
                    address_line1: '123 Đường ABC',
                    address_line2: 'Tòa nhà XYZ, Tầng 5',
                    province: 'Hà Nội',
                    district: 'Cầu Giấy',
                    ward: 'Dịch Vọng',
                    postal_code: '100000',
                    is_default: true,
                    is_billing: true,
                    is_shipping: true,
                    note: 'Giao hàng giờ hành chính',
                    full_address: '123 Đường ABC, Tòa nhà XYZ, Tầng 5, Dịch Vọng, Cầu Giấy, Hà Nội'
                },
                {
                    id: 2,
                    full_name: 'Trần Thị B',
                    phone: '0987654321',
                    address_line1: '456 Đường DEF',
                    address_line2: '',
                    province: 'TP. Hồ Chí Minh',
                    district: 'Quận 1',
                    ward: 'Bến Nghé',
                    postal_code: '700000',
                    is_default: false,
                    is_billing: false,
                    is_shipping: true,
                    note: '',
                    full_address: '456 Đường DEF, Bến Nghé, Quận 1, TP. Hồ Chí Minh'
                }
            ];
            setAddresses(mockAddresses);
            setError('API not available. Showing demo data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            phone: '',
            address_line1: '',
            address_line2: '',
            province: '',
            district: '',
            ward: '',
            postal_code: '',
            is_default: false,
            is_billing: false,
            is_shipping: true,
            note: '',
        });
        setEditingAddress(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await authApi(localStorage.getItem('access_token')).put(`/addresses/${editingAddress.id}/`, formData);
            } else {
                await authApi(localStorage.getItem('access_token')).post('/addresses/', formData);
            }
            resetForm();
            fetchAddresses();
        } catch (error) {
            console.log('Error saving address:', error);
        }
    };

    const handleEdit = (address) => {
        setEditingAddress(address);
        setFormData({
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            address_line2: address.address_line2 || '',
            province: address.province,
            district: address.district,
            ward: address.ward,
            postal_code: address.postal_code,
            is_default: address.is_default,
            is_billing: address.is_billing,
            is_shipping: address.is_shipping,
            note: address.note || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (addressId) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {
                await authApi(localStorage.getItem('access_token')).delete(`/addresses/${addressId}/`);
                fetchAddresses();
            } catch (error) {
                console.log('Error deleting address:', error);
            }
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            await authApi(localStorage.getItem('access_token')).post(`/addresses/${addressId}/set-default/`);
            fetchAddresses();
        } catch (error) {
            console.log('Error setting default address:', error);
        }
    };

    if (loading) {
        return <div className={cx('loading')}>Loading addresses...</div>;
    }

    if (error) {
        return (
            <div className={cx('address-container')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>My Addresses</h1>
                </div>
                <div className={cx('error-state')}>
                    <h3>Error Loading Addresses</h3>
                    <p>{error}</p>
                    <button 
                        className={cx('btn-retry')}
                        onClick={fetchAddresses}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('address-container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Addresses</h1>
                <button 
                    className={cx('btn-add')}
                    onClick={() => setShowForm(true)}
                >
                    <PlusIcon className={cx('icon')} />
                    Add New Address
                </button>
            </div>

            {showForm && (
                <AddressForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    isEditing={!!editingAddress}
                    showTitle={true}
                    showCheckboxes={true}
                />
                // <div className={cx('form-overlay')}>
                //     <div className={cx('form-card')}>
                //         <div className={cx('form-header')}>
                //             <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                //             <button 
                //                 className={cx('btn-close')}
                //                 onClick={resetForm}
                //             >
                //                 ×
                //             </button>
                //         </div>

                //         <form onSubmit={handleSubmit} className={cx('address-form')}>
                //             <div className={cx('form-row')}>
                //                 <div className={cx('form-group')}>
                //                     <label htmlFor="full_name">Full Name *</label>
                //                     <input
                //                         type="text"
                //                         id="full_name"
                //                         name="full_name"
                //                         value={formData.full_name}
                //                         onChange={handleInputChange}
                //                         required
                //                         className={cx('form-input')}
                //                     />
                //                 </div>
                //                 <div className={cx('form-group')}>
                //                     <label htmlFor="phone">Phone *</label>
                //                     <input
                //                         type="tel"
                //                         id="phone"
                //                         name="phone"
                //                         value={formData.phone}
                //                         onChange={handleInputChange}
                //                         required
                //                         className={cx('form-input')}
                //                         placeholder="0xxxxxxxxx"
                //                     />
                //                 </div>
                //             </div>

                //             <div className={cx('form-group')}>
                //                 <label htmlFor="address_line1">Address Line 1 *</label>
                //                 <input
                //                     type="text"
                //                     id="address_line1"
                //                     name="address_line1"
                //                     value={formData.address_line1}
                //                     onChange={handleInputChange}
                //                     required
                //                     className={cx('form-input')}
                //                     placeholder="Street address, house number"
                //                 />
                //             </div>

                //             <div className={cx('form-group')}>
                //                 <label htmlFor="address_line2">Address Line 2</label>
                //                 <input
                //                     type="text"
                //                     id="address_line2"
                //                     name="address_line2"
                //                     value={formData.address_line2}
                //                     onChange={handleInputChange}
                //                     className={cx('form-input')}
                //                     placeholder="Apartment, suite, etc. (optional)"
                //                 />
                //             </div>

                //             <div className={cx('form-row')}>
                //                 <div className={cx('form-group')}>
                //                     <label htmlFor="province">Province/City *</label>
                //                     <input
                //                         type="text"
                //                         id="province"
                //                         name="province"
                //                         value={formData.province}
                //                         onChange={handleInputChange}
                //                         required
                //                         className={cx('form-input')}
                //                     />
                //                 </div>
                //                 <div className={cx('form-group')}>
                //                     <label htmlFor="district">District *</label>
                //                     <input
                //                         type="text"
                //                         id="district"
                //                         name="district"
                //                         value={formData.district}
                //                         onChange={handleInputChange}
                //                         required
                //                         className={cx('form-input')}
                //                     />
                //                 </div>
                //             </div>

                //             <div className={cx('form-row')}>
                //                 <div className={cx('form-group')}>
                //                     <label htmlFor="ward">Ward *</label>
                //                     <input
                //                         type="text"
                //                         id="ward"
                //                         name="ward"
                //                         value={formData.ward}
                //                         onChange={handleInputChange}
                //                         required
                //                         className={cx('form-input')}
                //                     />
                //                 </div>
                //                 <div className={cx('form-group')}>
                //                     <label htmlFor="postal_code">Postal Code</label>
                //                     <input
                //                         type="text"
                //                         id="postal_code"
                //                         name="postal_code"
                //                         value={formData.postal_code}
                //                         onChange={handleInputChange}
                //                         className={cx('form-input')}
                //                         placeholder="6 digits"
                //                     />
                //                 </div>
                //             </div>

                //             <div className={cx('form-group')}>
                //                 <label htmlFor="note">Note</label>
                //                 <textarea
                //                     id="note"
                //                     name="note"
                //                     value={formData.note}
                //                     onChange={handleInputChange}
                //                     className={cx('form-textarea')}
                //                     placeholder="Additional delivery instructions"
                //                     rows="3"
                //                 />
                //             </div>

                //             <div className={cx('form-checkboxes')}>
                //                 <label className={cx('checkbox-label')}>
                //                     <input
                //                         type="checkbox"
                //                         name="is_default"
                //                         checked={formData.is_default}
                //                         onChange={handleInputChange}
                //                         className={cx('checkbox')}
                //                     />
                //                     Set as default address
                //                 </label>
                //                 <label className={cx('checkbox-label')}>
                //                     <input
                //                         type="checkbox"
                //                         name="is_billing"
                //                         checked={formData.is_billing}
                //                         onChange={handleInputChange}
                //                         className={cx('checkbox')}
                //                     />
                //                     Use for billing
                //                 </label>
                //                 <label className={cx('checkbox-label')}>
                //                     <input
                //                         type="checkbox"
                //                         name="is_shipping"
                //                         checked={formData.is_shipping}
                //                         onChange={handleInputChange}
                //                         className={cx('checkbox')}
                //                     />
                //                     Use for shipping
                //                 </label>
                //             </div>

                //             <div className={cx('form-actions')}>
                //                 <button type="submit" className={cx('btn-save')}>
                //                     {editingAddress ? 'Update Address' : 'Add Address'}
                //                 </button>
                //                 <button 
                //                     type="button" 
                //                     onClick={resetForm}
                //                     className={cx('btn-cancel')}
                //                 >
                //                     Cancel
                //                 </button>
                //             </div>
                //         </form>
                //     </div>
                // </div>
            )}

            <div className={cx('addresses-grid')}>
                {!Array.isArray(addresses) || addresses.length === 0 ? (
                    <div className={cx('empty-state')}>
                        <MapPinIcon className={cx('empty-icon')} />
                        <h3>No addresses yet</h3>
                        <p>Add your first delivery address to get started</p>
                        <button 
                            className={cx('btn-add-empty')}
                            onClick={() => setShowForm(true)}
                        >
                            Add Address
                        </button>
                    </div>
                ) : (
                    addresses.map((address) => (
                        <div key={address.id} className={cx('address-card', { default: address.is_default })}>
                            {address.is_default && (
                                <div className={cx('default-badge')}>Default</div>
                            )}
                            
                            <div className={cx('address-header')}>
                                <h3 className={cx('address-name')}>{address.full_name}</h3>
                                <div className={cx('address-actions')}>
                                    <button 
                                        onClick={() => handleEdit(address)}
                                        className={cx('btn-edit')}
                                        title="Edit"
                                    >
                                        <PencilIcon className={cx('icon')} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(address.id)}
                                        className={cx('btn-delete')}
                                        title="Delete"
                                    >
                                        <TrashIcon className={cx('icon')} />
                                    </button>
                                </div>
                            </div>

                            <div className={cx('address-content')}>
                                <p className={cx('address-phone')}>{address.phone}</p>
                                <p className={cx('address-text')}>{address.full_address}</p>
                                {address.note && (
                                    <p className={cx('address-note')}>
                                        <strong>Note:</strong> {address.note}
                                    </p>
                                )}
                            </div>

                            <div className={cx('address-footer')}>
                                <div className={cx('address-types')}>
                                    {address.is_shipping && <span className={cx('type-badge', 'shipping')}>Shipping</span>}
                                    {address.is_billing && <span className={cx('type-badge', 'billing')}>Billing</span>}
                                </div>
                                {!address.is_default && (
                                    <button 
                                        onClick={() => handleSetDefault(address.id)}
                                        className={cx('btn-set-default')}
                                    >
                                        Set as Default
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Address;
