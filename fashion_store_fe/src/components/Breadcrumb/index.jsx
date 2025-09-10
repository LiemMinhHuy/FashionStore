import styles from './Breadcrumb.module.scss';
import classNames from 'classnames/bind';
import React from 'react';

const cx = classNames.bind(styles);

function Breadcrumb({ children }) {
    return (
        <div className={cx('breadcrumb')}>
            {(() => {
                const totalChildren = React.Children.count(children);
                return React.Children.map(children, (child, idx) => (
                    <React.Fragment key={idx}>
                        <div className={cx('breadcrumb-link')}>{child}</div>
                        {idx < totalChildren - 1 && (
                            <span className={cx('breadcrumb-separator')}> &gt;</span>
                        )}
                    </React.Fragment>
                ));
            })()}
        </div>
    );
}

export default Breadcrumb;
