import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductItem.module.scss';

const cx = classNames.bind(styles);

function ProductItem({ data }) {
    return (
            <div className={cx('product-item')}>
                <Link to={`/products/${data.id}`} className={cx('image-link')}>
                    <div className={cx('product-image-container')}>
                        <img
                            src={
                                data.thumbnail
                                    ? data.thumbnail
                                          .replace('/media/https%3A', 'https://')
                                          .replace('http://127.0.0.1:8000', '')
                                    : '/path/to/default/image.jpg'
                            }
                            alt={data.name}
                            className={cx('product-image')}
                        />

                        {data.images && data.images[0] && (
                            <img
                                src={data.images[0].image
                                    .replace('/media/https%3A', 'https://')
                                    .replace('http://127.0.0.1:8000', '')}
                                alt="product-image"
                                className={cx('product-image')}
                            />
                        )}
                    </div>

                    <div className={cx('product-text')}>
                        <h3>{data.name}</h3>
                        <p>${data.price ? parseFloat(data.price).toFixed(0) : '0'}</p>
                    </div>
                </Link>
            </div>
    );
}

ProductItem.propTypes = {
    data: PropTypes.object.isRequired,
};

export default ProductItem;
