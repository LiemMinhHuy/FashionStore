import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import images from '../../../../assets/images';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHeart, faUser } from '@fortawesome/free-solid-svg-icons';
import Search from '../Search/Search';
import 'tippy.js/dist/tippy.css';
import Tippy from '@tippyjs/react';

const cx = classNames.bind(styles);

function Header() {
    return (
        <header className={cx('wrapper')}>
            <div>
                <div className={cx('logo')}>
                    <img src={images.logo} alt="HUI" />
                </div>
            </div>

            <div className={cx('inner')}>
                <Search />
                <Tippy delay={[0, 50]} content="Favorite" placement="bottom">
                    <button className={cx('favorite')}>
                        <FontAwesomeIcon icon={faHeart} />
                    </button>
                </Tippy>
                <Tippy delay={[0, 50]} content="Cart" placement="bottom">
                    <button className={cx('cart')}>
                        <FontAwesomeIcon icon={faCartShopping} />
                        <span className={cx('badge')}>12</span>
                    </button>
                </Tippy>
                <Tippy delay={[0, 50]} content="Login" placement="bottom">
                    <button className={cx('account')}>
                        <FontAwesomeIcon icon={faUser} />
                    </button>
                </Tippy>
            </div>
        </header>
    );
}

export default Header;
