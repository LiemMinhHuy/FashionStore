import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Blog.module.scss';
import * as request from '~/utils/request';
import { isCloseToBottom } from '~/utils/utils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cx = classNames.bind(styles);

const Blog = () => {
    const [news, setNews] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('-published_at');
    const [featuredNews, setFeaturedNews] = useState([]);

    // Load categories on component mount
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await request.get('news-categories/');
                if (response && response.results) {
                    setCategories(response.results);
                }
            } catch (err) {
                console.error('Error loading categories:', err);
            }
        };

        const loadFeaturedNews = async () => {
            try {
                const response = await request.get('news/featured/');
                if (response && Array.isArray(response)) {
                    setFeaturedNews(response);
                }
            } catch (err) {
                console.error('Error loading featured news:', err);
            }
        };

        loadCategories();
        loadFeaturedNews();
    }, []);

    useEffect(() => {
        const loadNews = async () => {
            if (!hasMore && page > 1) return;

            setLoading(true);
            try {
                // Build query parameters
                const params = new URLSearchParams({
                    page: page.toString(),
                    ordering: sortBy
                });
                
                if (selectedCategory) {
                    params.append('category', selectedCategory);
                }
                
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }

                const response = await request.get(`news/?${params.toString()}`);
                if (response && response.results) {
                    if (page === 1) {
                        setNews(response.results);
                    } else {
                        setNews((prevNews) => [...prevNews, ...response.results]);
                    }

                    setHasMore(response.next !== null);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error occurred:', err);
                setError('An error occurred while fetching news.');
                setLoading(false);
            }
        };

        loadNews();
    }, [page, hasMore, selectedCategory, searchQuery, sortBy]);

    const handleScroll = useCallback(() => {
        if (loading || !hasMore) return;
        if (isCloseToBottom(window)) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [loading, hasMore]);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setPage(1);
        setHasMore(true);
        setNews([]);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        setHasMore(true);
        setNews([]);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setPage(1);
        setHasMore(true);
        setNews([]);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatReadingTime = (minutes) => {
        return `${minutes} min read`;
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    if (loading && page === 1) return <h2>Loading news...</h2>;
    if (error) return <h2>Error: {error}</h2>;

    return (
        <div className={cx('news-list')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Our News</h1>
                <p className={cx('description')}>Stories, updates, and inspirations from our shop to you.</p>
            </div>

            {/* Featured News Section */}
            {featuredNews.length > 0 && (
                <div className={cx('featured-section')}>
                    <div className={cx('featured-grid')}>
                        {featuredNews.slice(0, 3).map((item) => (
                            <div key={item.id} className={cx('featured-item')}>
                                <Link to={`/news/${item.id}`}>
                                    <div className={cx('featured-image')}>
                                        <img
                                            src={
                                                item.image
                                                    ? item.image.replace('image/upload/https://', 'https://')
                                                    : '/path/to/default/image.jpg'
                                            }
                                            alt={item.title}
                                        />
                                        {item.category && (
                                            <span 
                                                className={cx('category-badge')}
                                                style={{ backgroundColor: item.category.color }}
                                            >
                                                {item.category.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className={cx('featured-content')}>
                                        <h3>{item.title}</h3>
                                        {item.summary && <p className={cx('summary')}>{item.summary}</p>}
                                        <div className={cx('meta-info')}>
                                            <span className={cx('date')}>{formatDate(item.published_at)}</span>
                                            {item.reading_time > 0 && (
                                                <span className={cx('reading-time')}>
                                                    {formatReadingTime(item.reading_time)}
                                                </span>
                                            )}
                                            <span className={cx('views')}>{item.view_count} views</span>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className={cx('filters-section')}>
                <div className={cx('search-bar')}>
                    <form onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className={cx('search-input')}
                        />
                        <button type="submit" className={cx('search-button')}>Search</button>
                    </form>
                </div>

                <div className={cx('filter-controls')}>
                    <div className={cx('category-filter')}>
                        <label>Category:</label>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className={cx('category-select')}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={cx('sort-filter')}>
                        <label>Sort by:</label>
                        <select 
                            value={sortBy} 
                            onChange={handleSortChange}
                            className={cx('sort-select')}
                        >
                            <option value="-published_at">Latest</option>
                            <option value="published_at">Oldest</option>
                            <option value="-view_count">Most Popular</option>
                            <option value="title">Title A-Z</option>
                            <option value="-title">Title Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* News Grid */}
            <div className={cx('news-grid')}>
                <h2>All Articles</h2>
                <div className={cx('news-items')}>
                    {news.length > 0 ? (
                        news.map((item) => (
                            <div key={item.id} className={cx('news-item')}>
                                <Link to={`/news/${item.id}`}>
                                    <div className={cx('image-container')}>
                                        <img
                                            src={
                                                item.image
                                                    ? item.image.replace('image/upload/https://', 'https://')
                                                    : '/path/to/default/image.jpg'
                                            }
                                            alt={item.title}
                                        />
                                        {item.category && (
                                            <span 
                                                className={cx('category-badge')}
                                                style={{ backgroundColor: item.category.color }}
                                            >
                                                {item.category.name}
                                            </span>
                                        )}
                                        {item.is_recently_published && (
                                            <span className={cx('new-badge')}>New</span>
                                        )}
                                    </div>
                                    <div className={cx('content')}>
                                        <h3>{item.title}</h3>
                                        {item.summary && (
                                            <p className={cx('summary')}>{item.summary}</p>
                                        )}
                                        <div className={cx('meta-info')}>
                                            {item.author && (
                                                <span className={cx('author')}>By {item.author}</span>
                                            )}
                                            <span className={cx('date')}>
                                                {formatDate(item.published_at)}
                                            </span>
                                            {item.reading_time > 0 && (
                                                <span className={cx('reading-time')}>
                                                    {formatReadingTime(item.reading_time)}
                                                </span>
                                            )}
                                            <span className={cx('views')}>{item.view_count} views</span>
                                            {item.comment_count > 0 && (
                                                <span className={cx('comments')}>
                                                    {item.comment_count} comments
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    ) : (
                        !loading && <p className={cx('no-results')}>No articles found.</p>
                    )}
                </div>
            </div>

            {loading && page > 1 && (
                <div className={cx('loading')}>
                    <p>Loading more articles...</p>
                </div>
            )}
            
            <ToastContainer />
        </div>
    );
};

export default Blog;
