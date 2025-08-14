import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.scss';
import classNames from 'classnames/bind';
import React from 'react';

const cx = classNames.bind(styles);

function Breadcrumb({ children }) {
    return (
        <div className={cx('breadcrumb')}>
            <div className={cx('breadcrumb-link')}>
                <Link to="/">Home</Link>
            </div>
            {React.Children.map(children, (child, idx) => (
                <>
                    <span className={cx('breadcrumb-separator')}> &gt;</span>
                    <div className={cx('breadcrumb-link')}>{child}</div>
                </>
            ))}
        </div>
    );
}

export default Breadcrumb;
