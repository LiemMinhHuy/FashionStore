// Header.js
import React, { useContext, useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import images from '../../../../assets/images';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faUser, faGear, faSignOut, faTruck } from '@fortawesome/free-solid-svg-icons';
import Search from '../Search/Search';
import 'tippy.js/dist/tippy.css';
import Tippy from '@tippyjs/react';
import { Link } from 'react-router-dom';
import { MyUserContext, MyDispatchContext } from '~/utils/Context/context'; // Import context của người dùng và dispatch
import { CartContext } from '~/utils/Context/cartContext'; // Import CartContext
import Menu from '~/components/Popper/Menu';
import Cart from '~/components/Cart';

const cx = classNames.bind(styles);

const userMenu = [
    {
        icon: <FontAwesomeIcon icon={faUser} />,
        title: 'View profile',
        to: '/profile',
    },
    {
        icon: <FontAwesomeIcon icon={faTruck} />,
        title: 'Orders',
        to: '/order',
    },
    {
        icon: <FontAwesomeIcon icon={faGear} />,
        title: 'Settings',
        to: '/settings',
    },
    {
        icon: <FontAwesomeIcon icon={faSignOut} />,
        title: 'Log out',
        separate: true,
    },
];

function Header() {
    const currentUser = useContext(MyUserContext); // Lấy thông tin người dùng từ context
    const dispatch = useContext(MyDispatchContext); // Lấy dispatch để xử lý logout
    const { cartItems } = useContext(CartContext); // Sử dụng CartContext
    const [showCart, setShowCart] = useState(false);

    // Hàm xử lý khi người dùng bấm nút Logout
    const handleLogout = () => {
        console.log('Logout button clicked');
        // Xóa thông tin đăng nhập khỏi localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');

        // Dispatch action để cập nhật lại trạng thái người dùng trong context
        dispatch({
            type: 'logout',
        });

        // Điều hướng người dùng về trang login
        window.location.href = '/login';
    };

    const toggleCart = () => {
        setShowCart(!showCart);
    };

    return (
        <header className={cx('wrapper')}>
            <Link to={'/'}>
                <div className={cx('logo')}>
                    <img src={images.logo} alt="Logo" />
                </div>
            </Link>
            <div className={cx('inner')}>
                <Search />
                <Tippy delay={[0, 50]} content="Favorite" placement="bottom">
                    <button className={cx('favorite')}>
                        <FontAwesomeIcon icon={faHeart} />
                    </button>
                </Tippy>
                <Tippy delay={[0, 50]} content="Cart" placement="bottom">
                    <button className={cx('cart')} onClick={toggleCart}>
                        <FontAwesomeIcon icon={faCartShopping} />
                        <span className={cx('badge')}>{cartItems.length}</span>
                    </button>
                </Tippy>

                {currentUser ? (
                    <div className={cx('user-actions')}>
                        <Menu
                            items={userMenu}
                            onChange={(item) => {
                                if (item.title === 'Log out') {
                                    handleLogout(); // Gọi hàm logout khi chọn "Log out"
                                }
                            }}
                        >
                            <img
                                className={cx('user-avatar')}
                                src={
                                    'https://res.cloudinary.com/ddoebyozj/image/upload/v1727621006/16b2e2579118bf6fba3b56523583117f_mpdtkl.jpg'
                                }
                                alt="User avatar"
                            />
                        </Menu>
                    </div>
                ) : (
                    <Link to="/login">
                        <Tippy delay={[0, 50]} content="Login" placement="bottom">
                            <button className={cx('account')}>
                                <FontAwesomeIcon icon={faUser} />
                            </button>
                        </Tippy>
                    </Link>
                )}
            </div>
            {showCart && <Cart onClose={toggleCart} />} {/* Cart sẽ lấy cartItems từ CartContext */}
        </header>
    );
}

export default Header;
