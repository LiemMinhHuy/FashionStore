import Header from '~/layouts/components/Header';

import classNames from 'classnames/bind';
import Footer from '~/layouts/components/Footer';
import styles from './DefaultLayout.module.scss';

const cx = classNames.bind(styles);

function DefaultLayout({ children }) {
    return (
        <div className={cx('wrapper')}>
            <Header />
            <div className={cx('container')}>
                {children}
            </div>
        </div>
    );
}

export default DefaultLayout;
