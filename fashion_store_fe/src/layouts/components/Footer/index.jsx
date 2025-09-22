// src/components/Footer/Footer.js
import React from 'react';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';

const cx = classNames.bind(styles);

const Footer = () => {
    return (
        <div className={cx('container')}>
            {/* Footer */}
            <footer className={cx('footer')}>
                <section className={cx('linksSection')}>
                    <div className={cx('linksContainer')}>
                        {/* Grid row */}
                        <div className={cx('row')}>
                            {/* Grid column: Company Info */}
                            <div className={cx('column', 'companyInfo')}>
                                <h2 className={cx('title')}>Hui</h2>
                                <p className={cx('email')}>liemminhhuy2003@gmail.com</p>
                                <p className={cx('phone')}>+84976862582</p>
                                <hr className={cx('divider')} />
                                <div className={cx('socialMedia')}>
                                    <a href="#" className={cx('socialLink')}>
                                        <img
                                            src="https://cdn.prod.website-files.com/67cfab9dc6cfb0ed75ec949b/67cfab9dc6cfb0ed75ec94b3_Facebook.svg"
                                            alt="Facebook icon"
                                        />
                                    </a>
                                    <a href="#" className={cx('socialLink')}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </a>
                                </div>

                                <div className={cx('"dynamic-text-wrap"')}>
                                    <div className={cx('dynamic-text')}>Fashion</div>
                                </div>
                            </div>

                            {/* Grid column: Contact */}
                            <div className={cx('column', 'contactInfo')}>
                                <h4 className={cx('title')}>Get In Touch</h4>
                                <div className={cx('newsletter')}>
                                    <h5>Subscribe to our Newsletter</h5>
                                    <div className={cx('newsletterInput')}>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className={cx('emailInput')}
                                        />
                                        <button className={cx('subscribeBtn')}>Subscribe</button>
                                    </div>
                                </div>
                                <hr className={cx('divider')} />
                                <p>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        style={{ marginRight: '0.8rem' }}
                                    >
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    123 Fashion Street, Style District, Ho Chi Minh City
                                </p>
                                <p>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        style={{ marginRight: '0.8rem' }}
                                    >
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                    info@fashionstore.com
                                </p>
                                <p>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        style={{ marginRight: '0.8rem' }}
                                    >
                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                    </svg>
                                    +84 976 862 582
                                </p>
                                <p>
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        style={{ marginRight: '0.8rem' }}
                                    >
                                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                                    </svg>
                                    Mon - Sat: 9:00 AM - 8:00 PM
                                </p>
                                <div className={cx('paymentMethods')}>
                                    <h5>We Accept</h5>
                                    <div className={cx('paymentIcons')}>
                                        <svg width="32" height="20" viewBox="0 0 24 16" fill="currentColor">
                                            <path d="M2 2h20v12H2V2zm0-2C.9 0 0 .9 0 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2H2z" />
                                            <path d="M6 6h2v1H6V6zm3 0h7v1H9V6zm-3 2h2v1H6V8zm3 0h7v1H9V8z" />
                                        </svg>
                                        <svg width="32" height="20" viewBox="0 0 24 16" fill="currentColor">
                                            <path d="M2 2h20v12H2V2zm0-2C.9 0 0 .9 0 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2H2z" />
                                            <path d="M6 6h2v1H6V6zm3 0h7v1H9V6zm-3 2h2v1H6V8zm3 0h7v1H9V8z" />
                                        </svg>
                                        <svg width="32" height="20" viewBox="0 0 24 16" fill="currentColor">
                                            <path d="M2 2h20v12H2V2zm0-2C.9 0 0 .9 0 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2H2z" />
                                            <path d="M7 5h10v1H7V5zm0 2h10v1H7V7zm0 2h6v1H7V9z" />
                                        </svg>
                                        <svg width="32" height="20" viewBox="0 0 24 16" fill="currentColor">
                                            <path d="M2 2h20v12H2V2zm0-2C.9 0 0 .9 0 2v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2H2z" />
                                            <path d="M4 6h4v4H4V6zm8-1h8v1h-8V5zm0 2h8v1h-8V7zm0 2h6v1h-6V9z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            {/* Grid column */}
                        </div>
                        {/* Grid row */}
                    </div>
                </section>
                {/* Section: Links */}

                {/* Copyright */}
                <div className={cx('copyright')}>
                    © 2024 Copyright:
                    <a className={cx('copyrightLink')} href="https://mdbootstrap.com/">
                        FashionStore.com
                    </a>
                </div>
                {/* Copyright */}
            </footer>
            {/* Footer */}
        </div>
    );
};

export default Footer;
