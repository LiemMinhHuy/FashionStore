import React from 'react';
import styles from './About.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

function About() {
    return (
        <div className={cx('container')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>About Us</h1>
                <p className={cx('description')}>Your premier destination for trendy and affordable fashion</p>
            </div>

            <div className={cx('loop-wrapper')}>
                <div className={cx('loop-gradient')}></div>
                <div className={cx('loop-content')}>
                    {/* First set of images */}
                    <div className={cx('loop-image1')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758259980/fashion_store/gallery/1.jpg"
                            alt="Fashion Gallery 1"
                        />
                    </div>
                    <div className={cx('loop-image2')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758259986/fashion_store/gallery/2.jpg"
                            alt="Fashion Gallery 2"
                        />
                    </div>
                    <div className={cx('loop-image3')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758260052/fashion_store/gallery/3.jpg"
                            alt="Fashion Gallery 3"
                        />
                    </div>
                    <div className={cx('loop-image4')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758260443/fashion_store/gallery/4.jpg"
                            alt="Fashion Gallery 4"
                        />
                    </div>
                    <div className={cx('loop-image5')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758260477/fashion_store/gallery/5.jpg"
                            alt="Fashion Gallery 5"
                        />
                    </div>

                    {/* Duplicate set for seamless loop */}
                    <div className={cx('loop-image1')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758259980/fashion_store/gallery/1.jpg"
                            alt="Fashion Gallery 1"
                        />
                    </div>
                    <div className={cx('loop-image2')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758259986/fashion_store/gallery/2.jpg"
                            alt="Fashion Gallery 2"
                        />
                    </div>
                    <div className={cx('loop-image3')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758260052/fashion_store/gallery/3.jpg"
                            alt="Fashion Gallery 3"
                        />
                    </div>
                    <div className={cx('loop-image4')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758260443/fashion_store/gallery/4.jpg"
                            alt="Fashion Gallery 4"
                        />
                    </div>
                    <div className={cx('loop-image5')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758260477/fashion_store/gallery/5.jpg"
                            alt="Fashion Gallery 5"
                        />
                    </div>
                </div>
                <div className={cx('loop-gradient2')}></div>
            </div>
        </div>
    );
}

export default About;
