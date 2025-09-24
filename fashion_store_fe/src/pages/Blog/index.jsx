import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Blog.module.scss';
import * as request from '~/utils/request';
import { isCloseToBottom } from '~/utils/utils';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from '~/components/Pagination';

const cx = classNames.bind(styles);

const Blog = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Load news articles
    useEffect(() => {
        const loadNews = async () => {
            if (!hasMore && page > 1) return;

            setLoading(true);
            try {
                const response = await request.get(`news/?page=${page}&ordering=-published_at`);
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
                setError(`An error occurred while fetching news: ${err.message}`);
                setLoading(false);
            }
        };

        loadNews();
    }, [page, hasMore]);

    const handleScroll = useCallback(() => {
        if (loading || !hasMore) return;
        if (isCloseToBottom(window)) {
            setPage((prevPage) => prevPage + 1);
        }
    }, [loading, hasMore]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading && page === 1) {
        return (
            <div className={cx('loading')}>
                <div className={cx('loading-spinner')}></div>
                <p>Loading news...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('error-container')}>
                <h2>Error: {error}</h2>
                <button onClick={() => window.location.reload()} className={cx('retry-button')}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={cx('news-list')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Our News</h1>
                <p className={cx('description')}>Stories, updates, and inspirations from our shop to you.</p>
            </div>

            {/* News Grid */}
            <div className={cx('news-grid')}>
                <div className={cx('news-items')}>
                    {news.length > 0
                        ? news.map((item) => (
                              <div key={item.id} className={cx('news-item')}>
                                  <Link
                                      to={`/blog/${item.id}`}
                                      onClick={() => console.log('Navigating to blog detail:', item.id)}
                                  >
                                      <div className={cx('image-container')}>
                                          <img
                                              src={
                                                  item.image
                                                      ? item.image.replace('image/upload/https://', 'https://')
                                                      : '/path/to/default/image.jpg'
                                              }
                                              alt={item.title}
                                              loading="lazy"
                                          />
                                      </div>
                                      <div className={cx('content')}>
                                          <h3 className={cx('title')}>{item.title}</h3>
                                          {item.summary && <p className={cx('summary')}>{item.summary}</p>}

                                          {/* Meta Information */}
                                          <div className={cx('meta-info')}>
                                              {item.published_at && (
                                                  <span className={cx('date')}>{formatDate(item.published_at)}</span>
                                              )}
                                              {item.reading_time && (
                                                  <span className={cx('reading-time')}>
                                                      {formatReadingTime(item.reading_time)}
                                                  </span>
                                              )}
                                              {item.view_count !== undefined && (
                                                  <span className={cx('views')}>{item.view_count} views</span>
                                              )}
                                          </div>
                                      </div>
                                  </Link>
                              </div>
                          ))
                        : !loading && <p className={cx('no-results')}>No articles found.</p>}
                </div>
            </div>

            {loading && page > 1 && (
                <div className={cx('loading')}>
                    <p>Loading more articles...</p>
                </div>
            )}

            {!loading && (
                <div className={cx('pagination-container')}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default Blog;
