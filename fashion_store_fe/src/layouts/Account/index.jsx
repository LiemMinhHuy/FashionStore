import Header from '~/layouts/components/Header';
import styles from './Account.module.scss';
import classNames from 'classnames/bind';
import Breadcrumb from '~/components/Breadcrumb';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react'; // Import useContext hook
import { MyUserContext } from '~/utils/Context/context'; // Import user context
import {
    UserCircleIcon,
    ArrowLeftStartOnRectangleIcon,
    ShoppingBagIcon,
    CreditCardIcon,
    TicketIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { logout } from '~/api/loginService';
import { resetAuthApi } from '~/utils/request';

const cx = classNames.bind(styles);

function Account({ children }) {
    const currentUser = useContext(MyUserContext); // Sử dụng context thay vì state
    const [active, setActive] = useState('Orders');
    const navigate = useNavigate();
    const location = useLocation();

    // Đồng bộ active state với URL hiện tại
    useEffect(() => {
        const path = location.pathname;
        if (path === '/profile') {
            setActive('Profile');
        } else if (path === '/order') {
            setActive('Orders');
        } else if (path === '/address') {
            setActive('Address');
        } else if (path === '/coupon') {
            setActive('Coupon');
        }
        // Có thể thêm các route khác sau
    }, [location.pathname]);

    const menuItems = [
        { key: 'Orders', label: 'Orders', icon: ShoppingBagIcon },
        { key: 'Profile', label: 'Profile', icon: UserCircleIcon },
        { key: 'Address', label: 'Address', icon: MapPinIcon },
        { key: 'Coupon', label: 'Coupon', icon: TicketIcon },
        { key: 'Log Out', label: 'Log Out', icon: ArrowLeftStartOnRectangleIcon },
    ];

    const handleSelect = (key) => {
        setActive(key);

        // Chuyển trang dựa trên key được chọn
        switch (key) {
            case 'Profile':
                navigate('/profile');
                break;
            case 'Orders':
                navigate('/order');
                break;
            case 'Address':
                navigate('/address');
                break;
            case 'Coupon':
                navigate('/coupon');
                break;
            case 'Cards':
                navigate('/cards');
                break;
            case 'Log Out':
                // Xử lý logout
                logout();
                resetAuthApi();
                navigate('/login');
                break;
            default:
                break;
        }
    };

    return (
        <div>
            <Header />
            <div className={cx('container')}>
                <Breadcrumb>
                    <Link to="/">Home</Link>
                    <Link to="/account">Account</Link>
                    <span>{active}</span>
                </Breadcrumb>
                <div className={cx('wrapper')}>
                    <div className={cx('sidebar')}>
                        <div className={cx('customer-cart')}>
                            <div className={cx('customer-cart-header')}>
                                <div className={cx('customer-name')}>
                                    {currentUser?.last_name} {currentUser?.first_name}
                                </div>
                            </div>
                            <div className={cx('customer-cart-body')}>
                                <div className={cx('customer-cart-item')}>
                                    <div className={cx('point-title')}>Point</div>
                                    <div className={cx('point-value')}>{currentUser?.point || 0}</div>
                                </div>
                                <div className={cx('customer-cart-item')}>
                                    <div className={cx('phone-title')}>Phone</div>
                                    <div className={cx('phone-value')}>{currentUser?.phone || 'Not updated yet'}</div>
                                </div>
                            </div>
                            <div className={cx('customer-cart-footer')}>
                                <div className={cx('member-title')}>Member</div>
                            </div>
                        </div>

                        <nav className={cx('account-menu')}>
                            <ul className={cx('menu-list')}>
                                {menuItems.map(({ key, label, icon: Icon }) => (
                                    <li
                                        key={key}
                                        className={cx('menu-item', { active: active === key })}
                                        onClick={() => handleSelect(key)}
                                    >
                                        <Icon className={cx('menu-icon')} />
                                        <span className={cx('menu-label')}>{label}</span>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                    <div className={cx('content')}>{children}</div>
                </div>
            </div>
        </div>
    );
}

export default Account;