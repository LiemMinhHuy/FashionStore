import React, { useState, useEffect } from 'react';
import 'react-awesome-slider/dist/styles.css';
import banner3 from '~/assets/images/banner3.jpg';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import { Link } from 'react-router-dom';
import * as ProductService from '~/api/productService';
import * as BlogService from '~/api/blogService';
import ProductItem from '~/components/ProductItem';

const cx = classNames.bind(styles);

const Home = () => {
    const [latestProducts, setLatestProducts] = useState([]);
    const [latestBlogs, setLatestBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [blogsLoading, setBlogsLoading] = useState(false);

    // Fetch latest 3 products when component mounts
    useEffect(() => {
        const fetchLatestProducts = async () => {
            setLoading(true);
            try {
                const result = await ProductService.getLatestProducts(4);
                setLatestProducts(result.results || []);
            } catch (error) {
                console.error('Error fetching latest products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestProducts();
    }, []);

    // Fetch latest 3 blogs when component mounts
    useEffect(() => {
        const fetchLatestBlogs = async () => {
            setBlogsLoading(true);
            try {
                const result = await BlogService.getLatestBlogs(4);
                setLatestBlogs(result.results || []);
            } catch (error) {
                console.error('Error fetching latest blogs:', error);
            } finally {
                setBlogsLoading(false);
            }
        };

        fetchLatestBlogs();
    }, []);

    return (
        <div className={cx('container')}>
            <div className={cx('banner-container')}>
                <img src={banner3} alt="banner" className={cx('banner')} />
                <Link to={'/products'}>
                    <button className={cx('button')}>Shop Now</button>
                </Link>
            </div>

            {/* Latest Products Section */}
            <div className={cx('products-section')}>
                <div className={cx('title-container')}>
                    <div className={cx('title-wrapper')}>
                        <h2 className={cx('title')}>New Arrivals</h2>
                        <p className={cx('subtitle')}>Fresh Selection</p>
                    </div>
                    <div className={cx('btn-view-all')}>
                        <Link to={'/products'}>View All Products</Link>
                    </div>
                </div>
                {loading ? (
                    <p>Loading latest products...</p>
                ) : (
                    <div className={cx('products-list')}>
                        {latestProducts.map((product) => (
                            <ProductItem key={product.id} data={product} />
                        ))}
                    </div>
                )}
                {latestProducts.length === 0 && !loading && <p>No products available.</p>}
            </div>
            <div className={cx('features-section')}>
                <section className={cx('features')} aria-label="Core values">
                    <article className={cx('feature-card')} id="feature-quality" aria-labelledby="title-quality">
                        <div className={cx('feature-index')} aria-hidden="true">
                            01
                        </div>
                        <div className={cx('feature-body')}>
                            <h3 id="title-quality" className={cx('feature-title')}>
                                Deliver with Quality
                            </h3>
                            <p className={cx('feature-desc')}>
                                Every product is crafted with care and attention to detail, ensuring the best for your
                                customers.
                            </p>
                        </div>
                    </article>

                    <article className={cx('feature-card')} id="feature-design" aria-labelledby="title-design">
                        <div className={cx('feature-index')} aria-hidden="true">
                            02
                        </div>
                        <div className={cx('feature-body')}>
                            <h3 id="title-design" className={cx('feature-title')}>
                                Designed to Impress
                            </h3>
                            <p className={cx('feature-desc')}>
                                A sleek, modern store that enhances your brand and creates a memorable shopping
                                experience.
                            </p>
                        </div>
                    </article>

                    <article className={cx('feature-card')} id="feature-curated" aria-labelledby="title-curated">
                        <div className={cx('feature-index')} aria-hidden="true">
                            03
                        </div>
                        <div className={cx('feature-body')}>
                            <h3 id="title-curated" className={cx('feature-title')}>
                                Curated for You
                            </h3>
                            <p className={cx('feature-desc')}>
                                Handpicked selections that reflect the latest trends and timeless essentials.
                            </p>
                        </div>
                    </article>
                </section>
            </div>

            <div className={cx('blog-section')}>
                <div className={cx('title-container')}>
                    <div className={cx('title-wrapper')}>
                        <h2 className={cx('title')}>Our News</h2>
                        <p className={cx('subtitle')}>explore the trends</p>
                    </div>
                    <div className={cx('btn-view-all')}>
                        <Link to={'/blog'}>View All Blogs</Link>
                    </div>
                </div>

                <div className={cx('blog-list')}>
                    {blogsLoading ? (
                        <p>Loading latest blogs...</p>
                    ) : (
                        <>
                            {/* Featured Blog (id = 11) - Left Side */}
                            {latestBlogs
                                .filter((blog) => blog.id === 11)
                                .map((blog) => (
                                    <div key={blog.id} className={cx('blog-item')}>
                                        <Link to={`/blog/${blog.id}`} className={cx('blog-link')}>
                                            <div className={cx('blog-special')}>
                                                <div className={cx('blog-img')}>
                                                    <img
                                                        src={
                                                            blog.image
                                                                ? blog.image.replace(
                                                                      'image/upload/https://',
                                                                      'https://',
                                                                  )
                                                                : 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758649854/fashion_store/Blog/blog7.png'
                                                        }
                                                        alt={blog.title}
                                                        className={cx('blog-image')}
                                                    />
                                                </div>
                                                <div className={cx('blog-content')}>
                                                    <div className={cx('blog-title')}>{blog.title}</div>
                                                    <div className={cx('blog-summary')}>{blog.summary}</div>
                                                    <div className={cx('blog-author')}>
                                                        <div className={cx('blog-author-wrapper')}>
                                                            <img
                                                                src="https://res.cloudinary.com/ddoebyozj/image/upload/v1757705018/fashion_store/avatar/avatar.jpg"
                                                                alt=""
                                                                className={cx('blog-author-avatar')}
                                                            />
                                                            <div className={cx('blog-author-info')}>
                                                                <div className={cx('blog-author-name')}>
                                                                    {blog.author || 'Admin'}
                                                                </div>
                                                                <div className={cx('blog-author-role')}>Author</div>
                                                            </div>
                                                        </div>
                                                        <div className={cx('blog-date')}>
                                                            {blog.published_at
                                                                ? new Date(blog.published_at).toLocaleDateString(
                                                                      'en-US',
                                                                      {
                                                                          year: 'numeric',
                                                                          month: 'long',
                                                                          day: 'numeric',
                                                                      },
                                                                  )
                                                                : 'Recent'}
                                                            {blog.reading_time && ` - ${blog.reading_time} min read`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}

                            {/* Other Blogs - Right Side Stacked */}
                            <div className={cx('blog-items-stack')}>
                                {latestBlogs
                                    .filter((blog) => blog.id !== 11)
                                    .map((blog) => (
                                        <div key={blog.id} className={cx('blog-item-normal')}>
                                            <Link to={`/blog/${blog.id}`} className={cx('blog-link')}>
                                                <div className={cx('blog-normal')}>
                                                    <div className={cx('blog-img')}>
                                                        <img
                                                            src={
                                                                blog.image
                                                                    ? blog.image.replace(
                                                                          'image/upload/https://',
                                                                          'https://',
                                                                      )
                                                                    : 'https://res.cloudinary.com/ddoebyozj/image/upload/v1758649854/fashion_store/Blog/blog7.png'
                                                            }
                                                            alt={blog.title}
                                                            className={cx('blog-image')}
                                                        />
                                                    </div>
                                                    <div className={cx('blog-content')}>
                                                        <div className={cx('blog-title')}>{blog.title}</div>
                                                        <div className={cx('blog-summary')}>
                                                            {blog.summary ||
                                                                'Discover the latest trends and insights in fashion.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                            </div>
                        </>
                    )}
                    {latestBlogs.length === 0 && !blogsLoading && <p>No blog posts available.</p>}
                </div>
            </div>
        </div>
    );
};

export default Home;
