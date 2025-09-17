import classNames from 'classnames/bind';
import styles from './AddressForm.module.scss';
import React from 'react';

const cx = classNames.bind(styles);

function AddressForm({
    // Data props
    formData = {
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
    },
    
    // Event handlers
    onInputChange,
    onSubmit,
    onCancel,
    
    // Configuration props
    isEditing = false,
    showTitle = true,
    showCheckboxes = true,
    submitButtonText = null,
    cancelButtonText = 'Cancel',
    
    // Style props
    className = '',
    disabled = false,
    showAsModal = true, // New prop to control modal vs inline display
}) {
    const handleInputChange = (e) => {
        if (onInputChange) {
            onInputChange(e);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(e);
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
    };

    const getSubmitButtonText = () => {
        if (submitButtonText) return submitButtonText;
        return isEditing ? 'Update Address' : 'Add Address';
    };

    const getTitle = () => {
        return isEditing ? 'Edit Address' : 'Add New Address';
    };

    const formContent = (
        <>
            {showTitle && (
                <div className={cx('form-header')}>
                    <h2>{getTitle()}</h2>
                    {showAsModal && (
                        <button className={cx('btn-close')} onClick={handleCancel} type="button">
                            ×
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className={cx('address-form', className)}>
                <div className={cx('form-row')}>
                    <div className={cx('form-group')}>
                        <label htmlFor="full_name">Full Name *</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={formData.full_name || ''}
                            onChange={handleInputChange}
                            required
                            disabled={disabled}
                            className={cx('form-input')}
                        />
                    </div>
                    <div className={cx('form-group')}>
                        <label htmlFor="phone">Phone *</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone || ''}
                            onChange={handleInputChange}
                            required
                            disabled={disabled}
                            className={cx('form-input')}
                            placeholder="0xxxxxxxxx"
                        />
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label htmlFor="address_line1">Address Line 1 *</label>
                    <input
                        type="text"
                        id="address_line1"
                        name="address_line1"
                        value={formData.address_line1 || ''}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        className={cx('form-input')}
                        placeholder="Street address, house number"
                    />
                </div>

                <div className={cx('form-group')}>
                    <label htmlFor="address_line2">Address Line 2</label>
                    <input
                        type="text"
                        id="address_line2"
                        name="address_line2"
                        value={formData.address_line2 || ''}
                        onChange={handleInputChange}
                        disabled={disabled}
                        className={cx('form-input')}
                        placeholder="Apartment, suite, etc. (optional)"
                    />
                </div>

                <div className={cx('form-row')}>
                    <div className={cx('form-group')}>
                        <label htmlFor="province">Province/City *</label>
                        <input
                            type="text"
                            id="province"
                            name="province"
                            value={formData.province || ''}
                            onChange={handleInputChange}
                            required
                            disabled={disabled}
                            className={cx('form-input')}
                        />
                    </div>
                    <div className={cx('form-group')}>
                        <label htmlFor="district">District *</label>
                        <input
                            type="text"
                            id="district"
                            name="district"
                            value={formData.district || ''}
                            onChange={handleInputChange}
                            required
                            disabled={disabled}
                            className={cx('form-input')}
                        />
                    </div>
                </div>

                <div className={cx('form-row')}>
                    <div className={cx('form-group')}>
                        <label htmlFor="ward">Ward *</label>
                        <input
                            type="text"
                            id="ward"
                            name="ward"
                            value={formData.ward || ''}
                            onChange={handleInputChange}
                            required
                            disabled={disabled}
                            className={cx('form-input')}
                        />
                    </div>
                    <div className={cx('form-group')}>
                        <label htmlFor="postal_code">Postal Code</label>
                        <input
                            type="text"
                            id="postal_code"
                            name="postal_code"
                            value={formData.postal_code || ''}
                            onChange={handleInputChange}
                            disabled={disabled}
                            className={cx('form-input')}
                            placeholder="6 digits"
                        />
                    </div>
                </div>

                <div className={cx('form-group')}>
                    <label htmlFor="note">Note</label>
                    <textarea
                        id="note"
                        name="note"
                        value={formData.note || ''}
                        onChange={handleInputChange}
                        disabled={disabled}
                        className={cx('form-textarea')}
                        placeholder="Additional delivery instructions"
                        rows="3"
                    />
                </div>

                {showCheckboxes && (
                    <div className={cx('form-checkboxes')}>
                        <label className={cx('checkbox-label')}>
                            <input
                                type="checkbox"
                                name="is_default"
                                checked={formData.is_default || false}
                                onChange={handleInputChange}
                                disabled={disabled}
                                className={cx('checkbox')}
                            />
                            Set as default address
                        </label>
                        <label className={cx('checkbox-label')}>
                            <input
                                type="checkbox"
                                name="is_billing"
                                checked={formData.is_billing || false}
                                onChange={handleInputChange}
                                disabled={disabled}
                                className={cx('checkbox')}
                            />
                            Use for billing
                        </label>
                        <label className={cx('checkbox-label')}>
                            <input
                                type="checkbox"
                                name="is_shipping"
                                checked={formData.is_shipping || false}
                                onChange={handleInputChange}
                                disabled={disabled}
                                className={cx('checkbox')}
                            />
                            Use for shipping
                        </label>
                    </div>
                )}

                <div className={cx('form-actions')}>
                    <button type="submit" className={cx('btn-save')} disabled={disabled}>
                        {getSubmitButtonText()}
                    </button>
                    <button type="button" onClick={handleCancel} className={cx('btn-cancel')}>
                        {cancelButtonText}
                    </button>
                </div>
            </form>
        </>
    );

    if (showAsModal) {
        return (
            <div className={cx('form-overlay')}>
                <div className={cx('form-card')}>
                    {formContent}
                </div>
            </div>
        );
    }

    return (
        <div className={cx('form-card')}>
            {formContent}
        </div>
    );
}

export default AddressForm;
