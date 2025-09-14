import React from 'react';
import 'react-awesome-slider/dist/styles.css';
import banner3 from '~/assets/images/banner3.jpg';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';

const cx = classNames.bind(styles);

const Home = () => (
    <div className={cx('container')}>
        <div className={cx('banner-container')}>
            <img src={banner3} alt="banner" className={cx('banner')} />
            <button className={cx('button')}> 
                Show Now
            </button>
        </div>
    </div>
);

export default Home;
