import Header from './Header';
import styles from './AdminLayout.module.scss';
import classNames from 'classnames/bind';
import SideBar from './SideBar';

const cx = classNames.bind(styles);

function AdminLayout({ children }) {
    return (
        <div className={cx('wrapper')}>
            <Header />
            <div className={cx('container')}>
                <SideBar />

                <div className={cx('content')}>{children}</div>
            </div>
        </div>
    );
}

export default AdminLayout;
