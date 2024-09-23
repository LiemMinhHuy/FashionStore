import styles from './SideBar.module.scss';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

function SideBar() {
    return (
        <aside className={cx('wrapper')}>
            <div className={cx('category')}>
                <p>T-Shirt</p>
                <FontAwesomeIcon icon={faAngleDown} />
            </div>
            <div className={cx('category')}>
                <p>Shoes</p>
                <FontAwesomeIcon icon={faAngleDown} />
            </div>
            <div className={cx('category')}>
                <p>Jackets</p>
                <FontAwesomeIcon icon={faAngleDown} />
            </div>
            <div className={cx('category')}>
                <p>Jeans</p>
                <FontAwesomeIcon icon={faAngleDown} />
            </div>
            <div className={cx('category')}>
                <p>Accessories</p>
                <FontAwesomeIcon icon={faAngleDown} />
            </div>
        </aside>
    );
}

export default SideBar;
