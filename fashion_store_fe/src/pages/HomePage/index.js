import React from 'react';
import AwesomeSlider from 'react-awesome-slider';
import 'react-awesome-slider/dist/styles.css';
import banner1 from '~/assets/images/banner1.jpg';
import banner2 from '~/assets/images/banner2.jpg';
import banner3 from '~/assets/images/banner3.jpg';
import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

const cx = classNames.bind(styles);

const HomePage = () => (
    <div className={cx('container')}>
        <AwesomeSlider>
            <div data-src={banner1} className={cx('banner')} />
            <div data-src={banner2} className={cx('banner')} />
            <div data-src={banner3} className={cx('banner')} />
        </AwesomeSlider>
    </div>
);

export default HomePage;
