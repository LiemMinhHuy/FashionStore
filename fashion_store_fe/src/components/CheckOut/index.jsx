import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '~/utils/Context/cartContext';
import styles from './CheckOut.module.scss';
import classNames from 'classnames/bind';
import { getAuthApi } from '~/utils/request';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/solid';
import { level1s, findLevel1ById, findById } from 'dvhcvn';
import { authApi } from '~/utils/request';
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import AddressForm from '~/components/AddressForm';

const cx = classNames.bind(styles);

const CheckOut = () => {
    const { cartItems, clearCart } = useContext(CartContext);
    const [shippingAddress, setShippingAddress] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [showNote, setShowNote] = useState(false);
    const [note, setNote] = useState('');

    // Form states for address input
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [districtId, setDistrictId] = useState('');
    const [wardId, setWardId] = useState('');
    const [street, setStreet] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [errors, setErrors] = useState({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const [addressDefault, setAddressDefault] = useState([]);
    const [showAddress, setShowAddress] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddressData, setNewAddressData] = useState({
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
            const response = await authApi(localStorage.getItem('access_token')).get('/addresses/');
            // Kiểm tra cấu trúc dữ liệu trả về
            if (Array.isArray(response.data)) {
                setAddressDefault(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                setAddressDefault(response.data.results);
            } else {
                setAddressDefault([]);
                console.log('Unexpected data structure:', response.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch addresses. Please try again later.');
        }
    };

    useEffect(() => {
        fetchAddresses();
        // Set default address as selected if available
        if (addressDefault.length > 0) {
            const defaultAddr = addressDefault.find((addr) => addr.is_default);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            }
        }
    }, [addressDefault.length]);

    // Handle new address form input changes
    const handleNewAddressChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAddressData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Handle address selection
    const handleAddressSelection = (addressId) => {
        setSelectedAddressId(addressId);
    };

    // Save selected address for checkout
    const handleSaveSelectedAddress = () => {
        if (selectedAddressId) {
            const selectedAddress = addressDefault.find((addr) => addr.id === selectedAddressId);
            if (selectedAddress) {
                // Update shipping address with selected address
                setShippingAddress(selectedAddress);
                setShowAddress(false);
                toast.success('Address selected successfully!');
            }
        } else {
            toast.error('Please select an address first.');
        }
    };

    // Handle new address form submission
    const handleNewAddressSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await authApi(localStorage.getItem('access_token')).post('/addresses/', newAddressData);
            if (response.data) {
                // Refresh addresses list
                await fetchAddresses();
                // Reset form
                setNewAddressData({
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
                setShowAddressForm(false);
                toast.success('New address added successfully!');
            }
        } catch (error) {
            console.error('Error adding new address:', error);
            toast.error('Failed to add new address. Please try again.');
        }
    };

    const handleAddForm = () => {
        setShowAddressForm(!showAddressForm);
        // Don't close the address modal when toggling the form
    };

    // Get list of provinces/cities
    const provinces = level1s;

    // Get list of districts based on selected province
    const districts = provinceId ? findLevel1ById(provinceId)?.children || [] : [];

    // Get list of wards based on selected district
    const wards = districtId ? findById(districtId)?.children || [] : [];

    const total = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const price = parseFloat(item.product.price);
            return sum + item.quantity * (isNaN(price) ? 0 : price);
        }, 0);
    }, [cartItems]);

    // Form validation functions
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

    // Form handlers
    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setPhone(value);

        // Clear phone error when user types
        if (errors.phone) {
            setErrors((prev) => ({ ...prev, phone: null }));
        }
    };

    const handlePostalCodeChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setPostalCode(value);

            // Clear postal code error when user types
            if (errors.postalCode) {
                setErrors((prev) => ({ ...prev, postalCode: null }));
            }
        }
    };

    const handleProvinceChange = (e) => {
        setProvinceId(e.target.value);
        setDistrictId('');
        setWardId('');
        // Clear province error
        if (errors.province) {
            setErrors((prev) => ({ ...prev, province: null, district: null, ward: null }));
        }
    };

    const handleDistrictChange = (e) => {
        setDistrictId(e.target.value);
        setWardId('');
        // Clear district error
        if (errors.district) {
            setErrors((prev) => ({ ...prev, district: null, ward: null }));
        }
    };

    const handleWardChange = (e) => {
        setWardId(e.target.value);
        // Clear ward error
        if (errors.ward) {
            setErrors((prev) => ({ ...prev, ward: null }));
        }
    };

    const handleAddressChange = (e) => {
        setShowAddressForm(false);
        setShowAddress(true);
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

    // Update shipping address when form changes
    React.useEffect(() => {
        const payload = getAddressPayload();
        setShippingAddress(payload); // payload can be null if validation fails
    }, [fullName, phone, provinceId, districtId, wardId, street, postalCode]);

    const handleCheckOut = async () => {
        console.log('Clicked');
        console.log('Shipping address:', shippingAddress);
        console.log('Selected address ID:', selectedAddressId);
        console.log('Payment method:', paymentMethod);
        console.log('Cart items:', cartItems);

        // Mark that user has attempted to submit
        setHasAttemptedSubmit(true);

        // Check if cart is empty
        if (!cartItems || cartItems.length === 0) {
            toast.error('Your cart is empty. Please add items before checkout.');
            return;
        }

        let payload = {
            payment_method: paymentMethod,
        };

        // If user has selected an existing address, use it directly
        if (selectedAddressId) {
            payload.shipping_address_id = selectedAddressId;
            console.log('Using selected address ID:', selectedAddressId);
        }
        // Otherwise, check if we have shipping address from form or manual input
        else if (shippingAddress && typeof shippingAddress === 'object') {
            // If shippingAddress has an ID, it's an existing address
            if (shippingAddress.id) {
                payload.shipping_address_id = shippingAddress.id;
                console.log('Using shipping address ID:', shippingAddress.id);
            }
            // If it has address_line1, it's a new address to be created
            else if (shippingAddress.address_line1) {
                // Validate form before proceeding
                const isFormValid = validateForm();
                if (!isFormValid) {
                    toast.error('Please fill in all required address information correctly.');
                    return;
                }

                try {
                    console.log('Creating address with data:', shippingAddress);
                    const createRes = await getAuthApi().post('/addresses/', shippingAddress);
                    if (createRes?.data?.id) {
                        payload.shipping_address_id = createRes.data.id;
                        console.log('Address created successfully with ID:', createRes.data.id);
                    } else {
                        console.error('Address creation failed: No ID returned');
                        toast.error('Unable to create shipping address');
                        return;
                    }
                } catch (e) {
                    console.error('Create address failed:', e);
                    console.error('Error details:', e.response?.data);

                    let errorMessage = 'Unable to create shipping address';
                    if (e.response?.data?.error) {
                        errorMessage = e.response.data.error;
                    } else if (e.response?.data?.phone) {
                        errorMessage = 'Phone number error: ' + e.response.data.phone[0];
                    } else if (e.response?.data?.postal_code) {
                        errorMessage = 'Postal code error: ' + e.response.data.postal_code[0];
                    }

                    toast.error(errorMessage);
                    return;
                }
            }
        } else {
            // No address provided
            toast.error('Please select or provide shipping address information.');
            return;
        }

        try {
            setLoading(true);
            console.log('Checkout payload:', payload);

            const response = await getAuthApi().post('/orders/checkout/', payload);
            console.log('Checkout response:', response);

            if ((response.status === 200 || response.status === 201) && response.data) {
                if (paymentMethod === 'VNPay' && response.data.payment_url) {
                    // Với VNPay, chuyển hướng đến trang thanh toán
                    window.location.href = response.data.payment_url;
                    // Không clear cart ở đây, sẽ clear sau khi thanh toán thành công
                } else if (paymentMethod === 'PayPal' && response.data.payment_url) {
                    // Với PayPal, chuyển hướng đến trang thanh toán
                    window.location.href = response.data.payment_url;
                    // Không clear cart ở đây, sẽ clear sau khi thanh toán thành công
                } else {
                    // Với các phương thức thanh toán khác (Cash, ZaloPay, Momo), clear cart ngay lập tức
                    clearCart();
                    navigate('/payment-success', { state: { orderData: response.data } });
                }
            } else {
                toast.error('Checkout failed, please try again');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            console.error('Error response:', error.response?.data);

            let errorMessage = 'An error occurred, please try again later';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            navigate('/payment-failed', {
                state: {
                    errorMessage: errorMessage,
                    orderData: { total_amount: total },
                },
            });
        } finally {
            setLoading(false);
        }
    };

    // const handlePayPalSuccess = async (data, actions) => {
    //     console.log('PayPal data:', data); // Log PayPal data
    //     if (data && data.id) {
    //         try {
    //             const payload = {
    //                 payment_method: 'PayPal', // Payment method
    //                 order_id: data.id, // PayPal transaction ID
    //             };

    //             const response = await getAuthApi().post('/orders/checkout/', payload);

    //             if (response.status === 200) {
    //                 clearCart(); // Clear cart only on successful payment
    //                 toast.success('PayPal payment successful!');
    //                 navigate('/payment-success', { state: { orderData: response.data } });
    //             } else {
    //                 toast.error('An error occurred while confirming payment.');
    //             }
    //         } catch (error) {
    //             console.error('Error processing PayPal payment:', error);
    //             toast.error('Error processing PayPal payment');
    //         }
    //     } else {
    //         toast.error('Invalid payment information.');
    //     }
    // };

    const paymentMethods = [
        {
            value: 'Cash',
            label: 'Cash on delivery (COD)',
            img: null,
        },
        {
            value: 'ZaloPay',
            label: 'ZaloPay',
            img: 'https://cdn.brandfetch.io/id_T-oXJkN/w/1624/h/1624/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1751816051661',
        },
        {
            value: 'VNPay',
            label: 'VNPay',
            img: 'https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg',
        },
        {
            value: 'Momo',
            label: 'Momo',
            img: 'https://cdn.brandfetch.io/idn4xaCzTm/w/1666/h/1666/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1734358527203',
        },
        {
            value: 'PayPal',
            label: 'PayPal',
            img: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Paypal_2014_logo.png',
        },
    ];

    return (
        <div className={cx('checkout-container')}>
            <div className={cx('header-checkout')}>
                <div className={cx('header-checkout-item')}>
                    <span className={cx('breadcrumb-item')}>Home</span>
                    <span className={cx('breadcrumb-item')}>/</span>
                    <span className={cx('breadcrumb-item-checkout')}>Checkout</span>
                </div>
            </div>
            <div className={cx('checkout-grid')}>
                <div className={cx('left-col')}>
                    <div className={cx('box', 'shipping-info')}>
                        {addressDefault && addressDefault.length > 0 ? (
                            <>
                                <div className={cx('shipping-info-header')}>
                                    <h3 className={cx('title')}>Delivery Information</h3>
                                    <button className={cx('btn-change')} onClick={() => handleAddressChange()}>
                                        Change
                                    </button>
                                </div>

                                {showAddress ? (
                                    <div className={cx('address-list-show')}>
                                        <div className={cx('add-list-container')}>
                                            <div className={cx('add-list-header')}>
                                                <h3 className={cx('add-list-title')}>
                                                    {showAddressForm ? 'Add New Address' : 'Select Address'}
                                                </h3>
                                                <button
                                                    className={cx('btn-close')}
                                                    onClick={() => setShowAddress(false)}
                                                >
                                                    <XMarkIcon className={cx('icon-close')} />
                                                </button>
                                            </div>
                                            {/* Address List - Only show when not adding new address */}
                                            {!showAddressForm &&
                                                addressDefault.map((address, index) => (
                                                    <div
                                                        key={address.id || index}
                                                        className={cx('address-item', {
                                                            default: address.is_default,
                                                            selected: selectedAddressId === address.id,
                                                        })}
                                                    >
                                                        <div className={cx('address-content')}>
                                                            <div className={cx('choose')}>
                                                                <input
                                                                    type="radio"
                                                                    name="selectedAddress"
                                                                    value={address.id}
                                                                    checked={selectedAddressId === address.id}
                                                                    onChange={() => handleAddressSelection(address.id)}
                                                                />
                                                            </div>
                                                            <div className={cx('add-info')}>
                                                                <div className={cx('add-fullname')}>
                                                                    {address.full_name}
                                                                </div>
                                                            </div>
                                                            <div className={cx('add-phone')}>{address.phone}</div>
                                                            <div className={cx('add-address')}>
                                                                {address.address_line1}, {address.ward},{' '}
                                                                {address.district}, {address.province}
                                                            </div>

                                                            <div className={cx('add-default')}>
                                                                {address.is_default && (
                                                                    <span className={cx('default-badge')}>Default</span>
                                                                )}
                                                            </div>

                                                            <button className={cx('btn-edit')}>
                                                                <PencilSquareIcon className={cx('icon-edit')} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            {/* Add New Address Form */}
                                            {showAddressForm && (
                                                <AddressForm
                                                    formData={newAddressData}
                                                    onInputChange={handleNewAddressChange}
                                                    onSubmit={handleNewAddressSubmit}
                                                    onCancel={() => setShowAddressForm(false)}
                                                    showCheckboxes={true}
                                                    submitButtonText="Add Address"
                                                    cancelButtonText="Cancel"
                                                    className="checkout-address-form"
                                                    showTitle={true}
                                                />
                                            )}

                                            <div className={cx('add-list-footer')}>
                                                <button className={cx('btn-add')} onClick={handleAddForm}>
                                                    <PlusIcon className={cx('add-icon')} />
                                                    {showAddressForm ? 'Cancel' : 'Add address'}
                                                </button>
                                                <button
                                                    className={cx('btn-save')}
                                                    onClick={handleSaveSelectedAddress}
                                                    disabled={!selectedAddressId}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <></>
                                )}

                                <div className={cx('existing-addresses-section')}>
                                    <div className={cx('address-list')}>
                                        {addressDefault
                                            .filter((address) => address.is_default)
                                            .map((address, index) => (
                                                <div
                                                    key={address.id || index}
                                                    className={cx('address-item', { default: address.is_default })}
                                                >
                                                    <div className={cx('address-content')}>
                                                        <div className={cx('add-info')}>
                                                            <div className={cx('add-fullname')}>
                                                                {address.full_name}
                                                            </div>
                                                            <div className={cx('add-default')}>
                                                                {address.is_default && (
                                                                    <span className={cx('default-badge')}>Default</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={cx('add-phone')}>{address.phone}</div>
                                                        <div className={cx('add-address')}>
                                                            {address.address_line1}, {address.ward}, {address.district},{' '}
                                                            {address.province}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className={cx('title')}>Delivery Information</h3>
                                <div className={cx('form-group')}>
                                    <form className={cx('checkout-form')}>
                                        <div className={cx('form-group')}>
                                            <label>Full name</label>
                                            <input
                                                type="text"
                                                className={cx('input', {
                                                    error: hasAttemptedSubmit && errors.fullName,
                                                })}
                                                value={fullName}
                                                onChange={(e) => {
                                                    setFullName(e.target.value);
                                                    if (errors.fullName) {
                                                        setErrors((prev) => ({ ...prev, fullName: null }));
                                                    }
                                                }}
                                                placeholder="Enter your full name"
                                                required
                                            />
                                            {hasAttemptedSubmit && errors.fullName && (
                                                <div className={cx('error-message')}>{errors.fullName}</div>
                                            )}
                                        </div>
                                        <div className={cx('form-group')}>
                                            <label>Phone</label>
                                            <input
                                                type="tel"
                                                className={cx('input', { error: hasAttemptedSubmit && errors.phone })}
                                                value={phone}
                                                onChange={handlePhoneChange}
                                                placeholder="Enter your phone number (e.g., 0901234567)"
                                                required
                                            />
                                            {hasAttemptedSubmit && errors.phone && (
                                                <div className={cx('error-message')}>{errors.phone}</div>
                                            )}
                                        </div>
                                        <div className={cx('form-group')}>
                                            <label>Province/City</label>
                                            <select
                                                value={provinceId}
                                                onChange={handleProvinceChange}
                                                className={cx('input', {
                                                    error: hasAttemptedSubmit && errors.province,
                                                })}
                                                required
                                            >
                                                <option value="">Province/city</option>
                                                {provinces.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {hasAttemptedSubmit && errors.province && (
                                                <div className={cx('error-message')}>{errors.province}</div>
                                            )}
                                        </div>
                                        <div className={cx('form-group')}>
                                            <label>District</label>
                                            <select
                                                value={districtId}
                                                onChange={handleDistrictChange}
                                                className={cx('input', {
                                                    error: hasAttemptedSubmit && errors.district,
                                                })}
                                                required
                                                disabled={!provinceId}
                                            >
                                                <option value="">District</option>
                                                {districts.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {hasAttemptedSubmit && errors.district && (
                                                <div className={cx('error-message')}>{errors.district}</div>
                                            )}
                                        </div>
                                        <div className={cx('form-group')}>
                                            <label>Ward</label>
                                            <select
                                                value={wardId}
                                                onChange={handleWardChange}
                                                className={cx('input', { error: hasAttemptedSubmit && errors.ward })}
                                                required
                                                disabled={!districtId}
                                            >
                                                <option value="">Ward</option>
                                                {wards.map((w) => (
                                                    <option key={w.id} value={w.id}>
                                                        {w.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {hasAttemptedSubmit && errors.ward && (
                                                <div className={cx('error-message')}>{errors.ward}</div>
                                            )}
                                        </div>
                                        <div className={cx('form-group')}>
                                            <label>Street/House number</label>
                                            <input
                                                type="text"
                                                className={cx('input', { error: hasAttemptedSubmit && errors.street })}
                                                value={street}
                                                onChange={(e) => {
                                                    setStreet(e.target.value);
                                                    if (errors.street) {
                                                        setErrors((prev) => ({ ...prev, street: null }));
                                                    }
                                                }}
                                                placeholder="Enter street, house number"
                                                required
                                            />
                                            {hasAttemptedSubmit && errors.street && (
                                                <div className={cx('error-message')}>{errors.street}</div>
                                            )}
                                        </div>
                                        <div className={cx('form-group')}>
                                            <label>Postal code (6 digits)</label>
                                            <input
                                                type="text"
                                                className={cx('input', {
                                                    error: hasAttemptedSubmit && errors.postalCode,
                                                })}
                                                value={postalCode}
                                                onChange={handlePostalCodeChange}
                                                placeholder="Enter 6-digit postal code"
                                                maxLength={6}
                                                required
                                            />
                                            {hasAttemptedSubmit && errors.postalCode && (
                                                <div className={cx('error-message')}>{errors.postalCode}</div>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className={cx('center-col')}>
                    <div className={cx('box', 'payment-method')}>
                        <div className={cx('payment-method-header')}>
                            <h3 className={cx('title')}>Payment Method</h3>
                            <button
                                type="button"
                                className={cx('change-btn')}
                                onClick={() => setShowPaymentModal(true)}
                            >
                                Change
                            </button>
                        </div>
                        {showPaymentModal && (
                            <div className={cx('modal-overlay')}>
                                <div className={cx('modal')}>
                                    <button className={cx('modal-close')} onClick={() => setShowPaymentModal(false)}>
                                        &times;
                                    </button>
                                    <h3 className={cx('title')}>Payment Method</h3>
                                    <div className={cx('payment-options')}>
                                        {paymentMethods.map((method) => (
                                            <label className={cx('payment-option')} key={method.value}>
                                                <div className={cx('payment-option-item')}>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value={method.value}
                                                        checked={paymentMethod === method.value}
                                                        onChange={() => setPaymentMethod(method.value)}
                                                    />
                                                    <span>{method.label}</span>
                                                </div>
                                                {method.img && (
                                                    <img
                                                        src={method.img}
                                                        alt={method.label}
                                                        className={cx('pay-logo')}
                                                    />
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                    <button className={cx('modal-confirm')} onClick={() => setShowPaymentModal(false)}>
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className={cx('payment-method-description')}>
                            {(() => {
                                const selected = paymentMethods.find((m) => m.value === paymentMethod);
                                return (
                                    selected && (
                                        <div className={cx('payment-method-description-item')}>
                                            <span>{selected.label}</span>
                                            {selected.img && (
                                                <img
                                                    src={selected.img}
                                                    alt={selected.label}
                                                    className={cx('pay-logo')}
                                                />
                                            )}
                                        </div>
                                    )
                                );
                            })()}
                        </div>
                    </div>
                    <div className={cx('box', 'voucher')}>
                        <h3 className={cx('title')}>Voucher/coupon</h3>
                        <input type="text" className={cx('input')} placeholder="Enter voucher code" />
                    </div>
                    <div className={cx('box', 'note-order')}>
                        <div className={cx('note-order-header')}>
                            <h3 className={cx('title')}>Order notes</h3>
                            <label className={cx('checkbox-label')}>
                                <input
                                    type="checkbox"
                                    checked={showNote}
                                    onChange={() => setShowNote((prev) => !prev)}
                                    className={cx('checkbox-input')}
                                />
                                <span
                                    style={{
                                        background: showNote ? '#219a6f' : '#ccc',
                                    }}
                                    className={cx('checkbox')}
                                >
                                    <span
                                        style={{
                                            left: showNote ? 20 : 2,
                                        }}
                                        className={cx('checkbox-icon')}
                                    />
                                </span>
                            </label>
                        </div>
                        {showNote && (
                            <textarea
                                className={cx('input-note')}
                                placeholder="Enter your request here"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        )}
                    </div>
                </div>
                <div className={cx('right-col')}>
                    <div className={cx('box', 'order-summary')}>
                        <h3 className={cx('title')}>Order Summary</h3>
                        <div className={cx('cart-items')}>
                            {cartItems.map((item) => (
                                <div key={item.id} className={cx('cart-item')}>
                                    <div className={cx('cart-image-container')}>
                                        <img
                                            src={
                                                item.product.thumbnail?.replace('/media/https%3A', 'https://') ||
                                                'https://via.placeholder.com/150x150?text=No+Image'
                                            }
                                            className={cx('cart-image')}
                                            alt={item.product.name || 'Product'}
                                        />
                                    </div>
                                    <div className={cx('item-info')}>
                                        <h4 className={cx('item-name')}>{item.product.name}</h4>
                                        <div className={cx('quantity-button-container')}>
                                            <MinusIcon className={cx('quantity-icon')} />
                                            <div className={cx('quantity-input')}>{item.quantity}</div>
                                            <PlusIcon className={cx('quantity-icon')} />
                                        </div>
                                        <span className={cx('item-price')}>{item.product.price}đ</span>
                                    </div>
                                </div>
                            ))}

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Order Total</span>
                                <span className={cx('item-total')}>${total.toFixed(0)}</span>
                            </div>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Shipping Fee</span>
                                <span className={cx('item-total')}>$10</span>
                            </div>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Discount</span>
                                <span className={cx('item-total')}>-$10</span>
                            </div>

                            <span className={cx('line')}></span>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Total</span>
                                <span className={cx('item-total')}>${total.toFixed(0)}</span>
                            </div>

                            <div className={cx('item-total-container')}>
                                <span className={cx('item-total-title')}>Estimated Reward Points</span>
                                <span className={cx('item-total')}>0</span>
                            </div>
                        </div>

                        <button onClick={handleCheckOut} className={cx('checkout-btn')} disabled={loading}>
                            {loading ? 'Processing...' : 'Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckOut;
