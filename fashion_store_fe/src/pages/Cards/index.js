import React, { useState, useEffect } from 'react';
import { authApi } from '~/utils/request';
import styles from './Cards.module.scss';
import classNames from 'classnames/bind';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    CreditCardIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const cx = classNames.bind(styles);

function Cards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [showCardNumbers, setShowCardNumbers] = useState({});
    const [formData, setFormData] = useState({
        card_holder_name: '',
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        is_default: false,
        card_type: 'credit', // credit or debit
        bank_name: '',
    });

    const fetchCards = async () => {
        try {
            setError(null);
            // Sử dụng mock data để demo
            const mockCards = [
                {
                    id: 1,
                    card_holder_name: 'NGUYEN VAN A',
                    card_number: '4111111111111111',
                    expiry_month: '12',
                    expiry_year: '2025',
                    cvv: '123',
                    is_default: true,
                    card_type: 'credit',
                    bank_name: 'Vietcombank',
                    created_at: '2024-01-15'
                },
                {
                    id: 2,
                    card_holder_name: 'TRAN THI B',
                    card_number: '5555555555554444',
                    expiry_month: '08',
                    expiry_year: '2026',
                    cvv: '456',
                    is_default: false,
                    card_type: 'debit',
                    bank_name: 'BIDV',
                    created_at: '2024-03-20'
                },
                {
                    id: 3,
                    card_holder_name: 'LE VAN C',
                    card_number: '378282246310005',
                    expiry_month: '03',
                    expiry_year: '2027',
                    cvv: '789',
                    is_default: false,
                    card_type: 'credit',
                    bank_name: 'Techcombank',
                    created_at: '2024-05-10'
                }
            ];
            setCards(mockCards);
            
            // Khởi tạo trạng thái ẩn/hiện cho tất cả thẻ
            const initialShowState = {};
            mockCards.forEach(card => {
                initialShowState[card.id] = false;
            });
            setShowCardNumbers(initialShowState);
        } catch (error) {
            console.log('Error fetching cards:', error);
            setError('Failed to load cards. Please try again later.');
            setCards([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCards();
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
            card_holder_name: '',
            card_number: '',
            expiry_month: '',
            expiry_year: '',
            cvv: '',
            is_default: false,
            card_type: 'credit',
            bank_name: '',
        });
        setEditingCard(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCard) {
                // Update existing card
                console.log('Updating card:', formData);
            } else {
                // Create new card
                console.log('Creating new card:', formData);
            }
            resetForm();
            fetchCards();
        } catch (error) {
            console.log('Error saving card:', error);
        }
    };

    const handleEdit = (card) => {
        setEditingCard(card);
        setFormData({
            card_holder_name: card.card_holder_name,
            card_number: card.card_number,
            expiry_month: card.expiry_month,
            expiry_year: card.expiry_year,
            cvv: card.cvv,
            is_default: card.is_default,
            card_type: card.card_type,
            bank_name: card.bank_name,
        });
        setShowForm(true);
    };

    const handleDelete = async (cardId) => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            try {
                console.log('Deleting card:', cardId);
                fetchCards();
            } catch (error) {
                console.log('Error deleting card:', error);
            }
        }
    };

    const handleSetDefault = async (cardId) => {
        try {
            console.log('Setting default card:', cardId);
            fetchCards();
        } catch (error) {
            console.log('Error setting default card:', error);
        }
    };

    const toggleCardNumberVisibility = (cardId) => {
        setShowCardNumbers(prev => ({
            ...prev,
            [cardId]: !prev[cardId]
        }));
    };

    const maskCardNumber = (cardNumber) => {
        if (!cardNumber) return '';
        const lastFour = cardNumber.slice(-4);
        const masked = '*'.repeat(cardNumber.length - 4);
        return masked + lastFour;
    };

    const getCardTypeIcon = (cardNumber) => {
        if (!cardNumber) return '💳';
        
        const firstDigit = cardNumber.charAt(0);
        const firstTwo = cardNumber.substring(0, 2);
        const firstFour = cardNumber.substring(0, 4);
        
        if (firstDigit === '4') return '💳'; // Visa
        if (firstTwo === '51' || firstTwo === '52' || firstTwo === '53' || firstTwo === '54' || firstTwo === '55') return '💳'; // Mastercard
        if (firstFour === '3782' || firstFour === '3714') return '💳'; // American Express
        if (firstFour === '6011') return '💳'; // Discover
        
        return '💳'; // Default
    };

    const getCardTypeName = (cardNumber) => {
        if (!cardNumber) return 'Unknown';
        
        const firstDigit = cardNumber.charAt(0);
        const firstTwo = cardNumber.substring(0, 2);
        const firstFour = cardNumber.substring(0, 4);
        
        if (firstDigit === '4') return 'Visa';
        if (firstTwo === '51' || firstTwo === '52' || firstTwo === '53' || firstTwo === '54' || firstTwo === '55') return 'Mastercard';
        if (firstFour === '3782' || firstFour === '3714') return 'American Express';
        if (firstFour === '6011') return 'Discover';
        
        return 'Unknown';
    };

    const formatExpiryDate = (month, year) => {
        return `${month}/${year}`;
    };

    const isExpired = (month, year) => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        const cardYear = parseInt(year);
        const cardMonth = parseInt(month);
        
        if (cardYear < currentYear) return true;
        if (cardYear === currentYear && cardMonth < currentMonth) return true;
        return false;
    };

    if (loading) {
        return <div className={cx('loading')}>Loading cards...</div>;
    }

    if (error) {
        return (
            <div className={cx('cards-container')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>Payment Cards</h1>
                </div>
                <div className={cx('error-state')}>
                    <h3>Error Loading Cards</h3>
                    <p>{error}</p>
                    <button 
                        className={cx('btn-retry')}
                        onClick={fetchCards}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('cards-container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Payment Cards</h1>
                <button 
                    className={cx('btn-add')}
                    onClick={() => setShowForm(true)}
                >
                    <PlusIcon className={cx('icon')} />
                    Add New Card
                </button>
            </div>

            {showForm && (
                <div className={cx('form-overlay')}>
                    <div className={cx('form-card')}>
                        <div className={cx('form-header')}>
                            <h2>{editingCard ? 'Edit Card' : 'Add New Card'}</h2>
                            <button 
                                className={cx('btn-close')}
                                onClick={resetForm}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={cx('card-form')}>
                            <div className={cx('form-group')}>
                                <label htmlFor="card_holder_name">Card Holder Name *</label>
                                <input
                                    type="text"
                                    id="card_holder_name"
                                    name="card_holder_name"
                                    value={formData.card_holder_name}
                                    onChange={handleInputChange}
                                    required
                                    className={cx('form-input')}
                                    placeholder="NGUYEN VAN A"
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>

                            <div className={cx('form-group')}>
                                <label htmlFor="card_number">Card Number *</label>
                                <input
                                    type="text"
                                    id="card_number"
                                    name="card_number"
                                    value={formData.card_number}
                                    onChange={handleInputChange}
                                    required
                                    className={cx('form-input')}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="19"
                                />
                            </div>

                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="expiry_month">Expiry Month *</label>
                                    <select
                                        id="expiry_month"
                                        name="expiry_month"
                                        value={formData.expiry_month}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                    >
                                        <option value="">Month</option>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month.toString().padStart(2, '0')}>
                                                {month.toString().padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="expiry_year">Expiry Year *</label>
                                    <select
                                        id="expiry_year"
                                        name="expiry_year"
                                        value={formData.expiry_year}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                    >
                                        <option value="">Year</option>
                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                            <option key={year} value={year.toString()}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="cvv">CVV *</label>
                                    <input
                                        type="text"
                                        id="cvv"
                                        name="cvv"
                                        value={formData.cvv}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                        placeholder="123"
                                        maxLength="4"
                                    />
                                </div>
                            </div>

                            <div className={cx('form-row')}>
                                <div className={cx('form-group')}>
                                    <label htmlFor="card_type">Card Type *</label>
                                    <select
                                        id="card_type"
                                        name="card_type"
                                        value={formData.card_type}
                                        onChange={handleInputChange}
                                        required
                                        className={cx('form-input')}
                                    >
                                        <option value="credit">Credit Card</option>
                                        <option value="debit">Debit Card</option>
                                    </select>
                                </div>
                                <div className={cx('form-group')}>
                                    <label htmlFor="bank_name">Bank Name</label>
                                    <input
                                        type="text"
                                        id="bank_name"
                                        name="bank_name"
                                        value={formData.bank_name}
                                        onChange={handleInputChange}
                                        className={cx('form-input')}
                                        placeholder="e.g., Vietcombank"
                                    />
                                </div>
                            </div>

                            <div className={cx('form-checkbox')}>
                                <label className={cx('checkbox-label')}>
                                    <input
                                        type="checkbox"
                                        name="is_default"
                                        checked={formData.is_default}
                                        onChange={handleInputChange}
                                        className={cx('checkbox')}
                                    />
                                    Set as default payment method
                                </label>
                            </div>

                            <div className={cx('form-actions')}>
                                <button type="submit" className={cx('btn-save')}>
                                    {editingCard ? 'Update Card' : 'Add Card'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={resetForm}
                                    className={cx('btn-cancel')}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className={cx('cards-grid')}>
                {cards.length === 0 ? (
                    <div className={cx('empty-state')}>
                        <CreditCardIcon className={cx('empty-icon')} />
                        <h3>No payment cards yet</h3>
                        <p>Add your first payment card for faster checkout</p>
                        <button 
                            className={cx('btn-add-empty')}
                            onClick={() => setShowForm(true)}
                        >
                            Add Card
                        </button>
                    </div>
                ) : (
                    cards.map((card) => (
                        <div key={card.id} className={cx('card-item', { 
                            default: card.is_default,
                            expired: isExpired(card.expiry_month, card.expiry_year)
                        })}>
                            <div className={cx('card-header')}>
                                <div className={cx('card-type')}>
                                    <span className={cx('card-icon')}>
                                        {getCardTypeIcon(card.card_number)}
                                    </span>
                                    <span className={cx('card-type-name')}>
                                        {getCardTypeName(card.card_number)}
                                    </span>
                                </div>
                                <div className={cx('card-actions')}>
                                    <button 
                                        onClick={() => toggleCardNumberVisibility(card.id)}
                                        className={cx('btn-toggle-visibility')}
                                        title={showCardNumbers[card.id] ? 'Hide' : 'Show'}
                                    >
                                        {showCardNumbers[card.id] ? (
                                            <EyeSlashIcon className={cx('icon')} />
                                        ) : (
                                            <EyeIcon className={cx('icon')} />
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => handleEdit(card)}
                                        className={cx('btn-edit')}
                                        title="Edit"
                                    >
                                        <PencilIcon className={cx('icon')} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(card.id)}
                                        className={cx('btn-delete')}
                                        title="Delete"
                                    >
                                        <TrashIcon className={cx('icon')} />
                                    </button>
                                </div>
                            </div>

                            <div className={cx('card-content')}>
                                <div className={cx('card-number')}>
                                    {showCardNumbers[card.id] 
                                        ? card.card_number.replace(/(\d{4})/g, '$1 ').trim()
                                        : maskCardNumber(card.card_number)
                                    }
                                </div>
                                
                                <div className={cx('card-details')}>
                                    <div className={cx('card-holder')}>
                                        <span className={cx('label')}>Card Holder:</span>
                                        <span className={cx('value')}>{card.card_holder_name}</span>
                                    </div>
                                    
                                    <div className={cx('card-expiry')}>
                                        <span className={cx('label')}>Expires:</span>
                                        <span className={cx('value')}>
                                            {formatExpiryDate(card.expiry_month, card.expiry_year)}
                                        </span>
                                    </div>

                                    {card.bank_name && (
                                        <div className={cx('card-bank')}>
                                            <span className={cx('label')}>Bank:</span>
                                            <span className={cx('value')}>{card.bank_name}</span>
                                        </div>
                                    )}

                                    <div className={cx('card-type-info')}>
                                        <span className={cx('label')}>Type:</span>
                                        <span className={cx('value', 'capitalize')}>
                                            {card.card_type} Card
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={cx('card-footer')}>
                                <div className={cx('card-status')}>
                                    {card.is_default && (
                                        <span className={cx('status-badge', 'default')}>
                                            <CheckCircleIcon className={cx('status-icon')} />
                                            Default
                                        </span>
                                    )}
                                    {isExpired(card.expiry_month, card.expiry_year) && (
                                        <span className={cx('status-badge', 'expired')}>
                                            <ExclamationTriangleIcon className={cx('status-icon')} />
                                            Expired
                                        </span>
                                    )}
                                </div>
                                
                                {!card.is_default && (
                                    <button 
                                        onClick={() => handleSetDefault(card.id)}
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

export default Cards;
