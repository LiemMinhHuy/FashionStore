import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductItem.module.scss';

const cx = classNames.bind(styles);

function ProductItem({ data }) {
    return (
        <Link to={`/@${data.id}`} className={cx('wrapper')}>
            <div className={cx('info')}>
                <h4 className={cx('name')}>
                    <span>{data.name}</span>
                </h4>
            </div>
        </Link>
    );
}

ProductItem.propTypes = {
    data: PropTypes.object.isRequired,
};

export default ProductItem;
