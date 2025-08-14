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
                {/* Section: Social media */}
                <section className={cx('socialMediaSection')}>
                    {/* Left */}
                    <div className={cx('leftSection')}>
                        <span>Get connected with us on social networks:</span>
                    </div>
                    {/* Left */}

                    {/* Right */}
                    <div className={cx('rightSection')}>
                        <a href="#" className={cx('socialLink')}>
                            <i className="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" className={cx('socialLink')}>
                            <i className="fab fa-twitter"></i>
                        </a>
                        <a href="#" className={cx('socialLink')}>
                            <i className="fab fa-google"></i>
                        </a>
                        <a href="#" className={cx('socialLink')}>
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="#" className={cx('socialLink')}>
                            <i className="fab fa-linkedin"></i>
                        </a>
                        <a href="#" className={cx('socialLink')}>
                            <i className="fab fa-github"></i>
                        </a>
                    </div>
                    {/* Right */}
                </section>
                {/* Section: Social media */}

                {/* Section: Links */}
                <section className={cx('linksSection')}>
                    <div className={cx('linksContainer')}>
                        {/* Grid row */}
                        <div className={cx('row')}>
                            {/* Grid column: Company Info */}
                            <div className={cx('column', 'companyInfo')}>
                                <h4 className={cx('title')}>Fashion Store</h4>
                                <hr className={cx('divider')} />
                                <p>
                                    Here you can use rows and columns to organize your footer content. Lorem ipsum dolor
                                    sit amet, consectetur adipisicing elit.
                                </p>
                            </div>
                            {/* Grid column */}

                            {/* Grid column: Products */}
                            <div className={cx('column', 'products')}>
                                <h4 className={cx('title')}>Products</h4>
                                <hr className={cx('divider')} />
                                <p>
                                    <a href="#!" className={cx('link')}>
                                        Category
                                    </a>
                                </p>
                                <p>
                                    <a href="#!" className={cx('link')}>
                                        Order
                                    </a>
                                </p>
                            </div>
                            {/* Grid column */}

                            {/* Grid column: Useful Links */}
                            <div className={cx('column', 'usefulLinks')}>
                                <h4 className={cx('title')}>Useful Links</h4>
                                <hr className={cx('divider')} />
                                <p>
                                    <a href="#!" className={cx('link')}>
                                        Your Account
                                    </a>
                                </p>
                                <p>
                                    <a href="#!" className={cx('link')}>
                                        Become an Affiliate
                                    </a>
                                </p>
                                <p>
                                    <a href="#!" className={cx('link')}>
                                        Shipping Rates
                                    </a>
                                </p>
                                <p>
                                    <a href="#!" className={cx('link')}>
                                        Help
                                    </a>
                                </p>
                            </div>
                            {/* Grid column */}

                            {/* Grid column: Contact */}
                            <div className={cx('column', 'contactInfo')}>
                                <h4 className={cx('title')}>Contact</h4>
                                <hr className={cx('divider')} />
                                <p>
                                    <i className="fas fa-home"></i> THPCM, 12 10012, US
                                </p>
                                <p>
                                    <i className="fas fa-envelope"></i> liemminhhuy2003@gmail.com
                                </p>
                                <p>
                                    <i className="fas fa-phone"></i> 0976862582
                                </p>
                                <p>
                                    <i className="fas fa-print"></i> 0976862582
                                </p>
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
