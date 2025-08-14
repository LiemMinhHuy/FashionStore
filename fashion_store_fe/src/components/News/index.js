import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './News.module.scss';
import * as request from '~/utils/request';
import { isCloseToBottom } from '~/utils/utils';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cx = classNames.bind(styles);

const NewsList = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const loadNews = async () => {
            if (!hasMore) return;

            setLoading(true);
            try {
                const response = await request.get(`news/?page=${page}`); // Gọi API để lấy tin tức
                if (response && response.results) {
                    setNews((prevNews) => [...prevNews, ...response.results]);

                    if (response.next === null) {
                        setHasMore(false);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Error occurred:', err);
                setError('An error occurred while fetching news.');
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
            <h2>News</h2>
            <div className={cx('news-items')}>
                {news.length > 0 ? (
                    news.map((item) => (
                        <div key={item.id} className={cx('news-item')}>
                            <Link to={`/news/${item.id}`}>
                                <img
                                    src={
                                        item.image
                                            ? item.image.replace('image/upload/https://', 'https://')
                                            : '/path/to/default/image.jpg'
                                    }
                                    alt={item.title}
                                />
                                <h3>{item.title}</h3>
                            </Link>
                        </div>
                    ))
                ) : (
                    <p>No news found.</p>
                )}
            </div>
            {loading && page > 1 && <h2>Loading more news...</h2>}
            <ToastContainer />
        </div>
    );
};

export default NewsList;
