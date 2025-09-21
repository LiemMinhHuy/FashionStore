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
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758460553/fashion_store/gallery/3.jpg"
                            alt="Fashion Gallery 3"
                        />
                    </div>
                    <div className={cx('loop-image4')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758460725/fashion_store/gallery/4.jpg"
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
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758460553/fashion_store/gallery/3.jpg"
                            alt="Fashion Gallery 3"
                        />
                    </div>
                    <div className={cx('loop-image4')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758460725/fashion_store/gallery/4.jpg"
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

            <div className={cx('value-container')}>
                <div className={cx('value-wrapper')}>
                    <div className={cx('value-image')}>
                        <img
                            src="https://res.cloudinary.com/ddoebyozj/image/upload/v1758259986/fashion_store/gallery/2.jpg"
                            alt="Value 1"
                            className={cx('image')}
                        />
                    </div>
                    <div className={cx('value-text')}>
                        <article className={cx('value-card')} id="value-quality">
                            <div className={cx('value-index')}>01</div>
                            <div className={cx('value-body')}>
                                <h3 className={cx('value-title')}>Quality First</h3>
                                <p className={cx('value-desc')}>
                                    We prioritize well-crafted, durable products designed to bring value and reliability
                                    to your everyday life.
                                </p>
                            </div>
                        </article>

                        <article className={cx('value-card')} id="value-customer">
                            <div className={cx('value-index')}>02</div>
                            <div className={cx('value-body')}>
                                <h3 className={cx('value-title')}>Customer-Centered</h3>
                                <p className={cx('value-desc')}>
                                    Your satisfaction comes first, with seamless shopping experiences, responsive
                                    support, and thoughtfully curated products.
                                </p>
                            </div>
                        </article>

                        <article className={cx('value-card')} id="value-integrity">
                            <div className={cx('value-index')}>03</div>
                            <div className={cx('value-body')}>
                                <h3 className={cx('value-title')}>Integrity & Transparency</h3>
                                <p className={cx('value-desc')}>
                                    We believe in honest communication, ethical sourcing, and delivering exactly what we
                                    promise—no surprises.
                                </p>
                            </div>
                        </article>

                        <article className={cx('value-card')} id="value-community">
                            <div className={cx('value-index')}>04</div>
                            <div className={cx('value-body')}>
                                <h3 className={cx('value-title')}>Community Focused</h3>
                                <p className={cx('value-desc')}>
                                    We build connections by valuing our customers, supporting small businesses, and
                                    giving back whenever possible.
                                </p>
                            </div>
                        </article>
                    </div>
                </div>
            </div>

            
        </div>
    );
}

export default About;
