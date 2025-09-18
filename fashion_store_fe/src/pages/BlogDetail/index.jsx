import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './BlogDetail.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';
import { authApi } from '~/utils/request';
import RequireAuth from '~/components/RequireAuth';

const cx = classNames.bind(styles);

// Global cache for preventing duplicate requests across component instances
const globalRequestCache = new Map();

const BlogDetail = () => {
    const { blogId } = useParams();
    const navigate = useNavigate();
    const [newsItem, setNewsItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [isFetching, setIsFetching] = useState(false); // Add fetching state to prevent duplicates

    // Check authentication status on component mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        console.log('BlogDetail component mounted. Authentication check:', { hasToken: !!token, blogId });
        setIsAuthenticated(!!token);
    }, []);

    const fetchNewsDetail = useCallback(async () => {
        // Check global cache to prevent duplicate requests across component instances
        const cacheKey = `news_${blogId}`;
        if (globalRequestCache.has(cacheKey)) {
            console.log('Request already in progress globally, waiting...');
            try {
                const cachedData = await globalRequestCache.get(cacheKey);
                setNewsItem(cachedData);
                setHasLoadedOnce(true);
                setLoading(false);
                return;
            } catch (err) {
                console.warn('Global cache request failed:', err);
                globalRequestCache.delete(cacheKey);
            }
        }
        
        // Prevent multiple simultaneous calls from same component
        if (isFetching) {
            console.log('Already fetching, skipping duplicate request');
            return;
        }
        
        // Prevent multiple calls from React StrictMode or re-renders
        if (hasLoadedOnce && newsItem && newsItem.id == blogId) {
            console.log('Article already loaded, skipping fetch');
            return;
        }
        
        console.log('Fetching blog detail for ID:', blogId);
        setIsFetching(true);
        
        // Enhanced browser-side protection with longer cache duration
        const recentViews = sessionStorage.getItem(`recent_blog_views`) || '[]';
        const recentViewsArray = JSON.parse(recentViews);
        
        // Check if we've viewed this article in the last 30 seconds
        const thirtySecondsAgo = Date.now() - 30000;
        const recentView = recentViewsArray.find(view => 
            view.blogId === blogId && view.timestamp > thirtySecondsAgo
        );
        
        // Additional protection: check localStorage for longer-term caching
        const lastViewedKey = `blog_last_viewed_${blogId}`;
        const lastViewed = localStorage.getItem(lastViewedKey);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        const hasViewedRecently = recentView || (lastViewed && parseInt(lastViewed) > fiveMinutesAgo);
        
        setLoading(true);
        
        // Create promise for global cache
        const requestPromise = (async () => {
            try {
                let response;
                
                if (hasViewedRecently) {
                    console.log('Article viewed recently, fetching without view increment.');
                    // Always use normal request to avoid Network Error with custom headers
                    // Backend will handle view tracking through session
                    response = await axios.get(`http://127.0.0.1:8000/news/${blogId}/`);
                    console.log('Successfully fetched cached article');
                } else {
                    // Normal first-time request
                    response = await axios.get(`http://127.0.0.1:8000/news/${blogId}/`);
                    
                    // Record this view in both session and local storage only for new views
                    const newView = { blogId, timestamp: Date.now() };
                    const updatedViews = [newView, ...recentViewsArray.slice(0, 9)];
                    sessionStorage.setItem('recent_blog_views', JSON.stringify(updatedViews));
                    
                    // Also store in localStorage for longer-term protection
                    localStorage.setItem(lastViewedKey, Date.now().toString());
                    console.log('New article view recorded');
                }
                
                console.log('Blog detail response:', response.data);
                return response.data;
                
            } catch (err) {
                console.error('Error occurred while fetching blog detail:', err);
                throw err;
            }
        })();
        
        // Store promise in global cache
        globalRequestCache.set(cacheKey, requestPromise);
        
        try {
            const data = await requestPromise;
            setNewsItem(data);
            setHasLoadedOnce(true);
        } catch (err) {
            setError(`Error occurred while fetching news details: ${err.message}`);
        } finally {
            setLoading(false);
            setIsFetching(false);
            // Clean up cache after 1 second to allow for other components
            setTimeout(() => {
                globalRequestCache.delete(cacheKey);
            }, 1000);
        }
    }, [blogId, hasLoadedOnce, newsItem, isFetching]);

    const fetchComments = useCallback(async () => {
        const token = localStorage.getItem('access_token');
        console.log('Checking authentication for comments...', { hasToken: !!token });
        
        // Check if user is authenticated
        if (!token) {
            console.log('User not authenticated, comments will not be loaded. Login required for commenting.');
            setIsAuthenticated(false);
            setComments([]);
            return;
        }
        
        setIsAuthenticated(true);
        
        try {
            const response = await authApi(token).get(`news/${blogId}/add-comments/`);
            if (response.data && Array.isArray(response.data)) {
                setComments(response.data);
            } else {
                console.error('Comments response is not in expected format:', response);
                // Don't set error for comments, just log it
                console.log('Unable to load comments, but article content is available');
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            if (err.response?.status === 401) {
                console.log('Authentication expired, user needs to login for comments');
                setIsAuthenticated(false);
                localStorage.removeItem('access_token'); // Clear invalid token
            }
            // Don't set error state for comments, just log
            console.log('Comments unavailable, but article content loads normally');
        }
    }, [blogId]);

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        
        if (comment.trim()) {
            try {
                const parentId = replyingTo !== null ? replyingTo : null;
                const token = localStorage.getItem('access_token');
                
                if (!token) {
                    setShowLoginPrompt(true);
                    return;
                }
                
                const response = await authApi(token).post(
                    `news/${blogId}/add-comments/`,
                    {
                        content: comment,
                        parent_comment: parentId,
                    },
                );
                if (response && response.data) {
                    setComments((prevComments) => {
                        if (parentId) {
                            return prevComments.map((c) =>
                                c.id === parentId ? { ...c, replies: [...(c.replies || []), response.data] } : c,
                            );
                        } else {
                            return [...prevComments, response.data];
                        }
                    });
                } else {
                    console.error('Invalid response after sending comment:', response);
                    alert('Error occurred while sending comment.');
                }
                setComment('');
                setReplyingTo(null);
            } catch (err) {
                console.error('Error sending comment:', err);
                if (err.response?.status === 401) {
                    setIsAuthenticated(false);
                    localStorage.removeItem('access_token');
                    setShowLoginPrompt(true);
                } else {
                    alert('Error occurred while sending comment.');
                }
            }
        }
    };

    const handleReplyClick = (commentId) => {
        setReplyingTo(commentId);
        setComments((prevComments) => prevComments.map((c) => (c.id === commentId ? { ...c, showReply: true } : c)));
    };

    const handleCancelReplyClick = () => {
        setReplyingTo(null);
        setComments((prevComments) => prevComments.map((c) => ({ ...c, showReply: false })));
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }
        
        if (replyingTo === null) return;

        const parentCommentId = replyingTo;
        const content = document.getElementById(`comment-reply-${parentCommentId}`).value.trim();

        if (!content) return;

        try {
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                setShowLoginPrompt(true);
                return;
            }
            
            const response = await authApi(token).post(
                `news/${blogId}/add-comments/`,
                {
                    content,
                    parent_comment: parentCommentId,
                },
            );
            if (response.status === 201 && response.data) {
                setComments((prevComments) =>
                    prevComments.map((c) =>
                        c.id === parentCommentId ? { ...c, replies: [...(c.replies || []), response.data] } : c,
                    ),
                );
                handleCancelReplyClick();
            } else {
                console.error('Error submitting comment:', response);
                alert('Error occurred while sending reply.');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            if (error.response?.status === 401) {
                setIsAuthenticated(false);
                localStorage.removeItem('access_token');
                setShowLoginPrompt(true);
            } else {
                alert('Error occurred while sending reply.');
            }
        }
    };

    const toggleExpandReplies = (commentId) => {
        setExpandedComments((prevExpandedComments) => ({
            ...prevExpandedComments,
            [commentId]: !prevExpandedComments[commentId],
        }));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        // Reset state when blogId changes
        if (!hasLoadedOnce || (newsItem && newsItem.id != blogId)) {
            setHasLoadedOnce(false);
            setNewsItem(null);
            setComments([]);
            setLoading(true);
            
            // Load data for new article
            fetchNewsDetail();
            // Always try to fetch comments regardless of cache, but skip if not authenticated
            const token = localStorage.getItem('access_token');
            if (token) {
                fetchComments();
            } else {
                console.log('No authentication token found, comments will be unavailable');
                setIsAuthenticated(false);
            }
        }
    }, [blogId]); // Only depend on blogId to prevent unnecessary re-runs

    if (loading) {
        return (
            <div className={cx('loading-container')}>
                <div className={cx('loading-spinner')}></div>
                <p>Loading article details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('error-container')}>
                <h2>Error: {error}</h2>
                <button onClick={() => navigate('/blog')} className={cx('back-button')}>
                    Back to Blog
                </button>
            </div>
        );
    }

    return (
        <div className={cx('blog-detail-container')}>
            {newsItem ? (
                <article className={cx('blog-detail')}>
                    {/* Header Section */}
                    <header className={cx('article-header')}>
                        
                        {newsItem.category && (
                            <span className={cx('category-badge')}>
                                {newsItem.category.name}
                            </span>
                        )}
                        
                        <h1 className={cx('article-title')}>{newsItem.title}</h1>
                        
                        {newsItem.summary && (
                            <p className={cx('article-summary')}>{newsItem.summary}</p>
                        )}
                        
                        <div className={cx('article-meta')}>
                            <div className={cx('meta-item')}>
                                <span className={cx('meta-label')}>Published:</span>
                                <span className={cx('meta-value')}>
                                    {newsItem.published_at ? formatDate(newsItem.published_at) : formatDate(newsItem.created_at)}
                                </span>
                            </div>
                            {newsItem.reading_time && (
                                <div className={cx('meta-item')}>
                                    <span className={cx('meta-label')}>Reading time:</span>
                                    <span className={cx('meta-value')}>{newsItem.reading_time} min</span>
                                </div>
                            )}
                            {newsItem.view_count !== undefined && (
                                <div className={cx('meta-item')}>
                                    <span className={cx('meta-label')}>Views:</span>
                                    <span className={cx('meta-value')}>{newsItem.view_count}</span>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Featured Image */}
                    {newsItem.image && (
                        <div className={cx('featured-image')}>
                            <img
                                src={newsItem.image.replace('image/upload/https://', 'https://')}
                                alt={newsItem.title}
                                loading="lazy"
                            />
                        </div>
                    )}

                    {/* Article Content */}
                    <div className={cx('article-content')}>
                        <div 
                            className={cx('content-body')}
                            dangerouslySetInnerHTML={{ __html: newsItem.content }}
                        />
                    </div>

                    {/* Tags */}
                    {newsItem.tags && (
                        <div className={cx('tags-section')}>
                            <h4>Tags:</h4>
                            <div className={cx('tags-list')}>
                                {newsItem.tags.split(',').map((tag, index) => (
                                    <span key={index} className={cx('tag')}>
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    {/* <section className={cx('comments-section')}>
                        <h3 className={cx('comments-title')}>
                            Comments ({comments.length})
                        </h3>
                        
                        {showLoginPrompt && (
                            <div className={cx('auth-prompt-container')}>
                                <RequireAuth onClose={() => setShowLoginPrompt(false)} />
                            </div>
                        )}
                        
                        {isAuthenticated ? (
                            <form onSubmit={handleCommentSubmit} className={cx('comment-form')}>
                                <textarea
                                    value={comment}
                                    onChange={handleCommentChange}
                                    placeholder="Share your thoughts..."
                                    rows="4"
                                    className={cx('comment-input')}
                                    required
                                />
                                <button type="submit" className={cx('comment-submit')}>
                                    Post Comment
                                </button>
                            </form>
                        ) : (
                            <div className={cx('comment-form', 'auth-required')}>
                                <RequireAuth onClose={() => {}} />
                            </div>
                        )}

                        <div className={cx('comments-list')}>
                            {comments.length > 0 ? (
                                comments.map((c) => (
                                    <div key={c.id} className={cx('comment')}>
                                        <div className={cx('comment-header')}>
                                            <div className={cx('user-info')}>
                                                <img
                                                    src={c.user.avatar || '/default-avatar.png'}
                                                    alt={c.user.username}
                                                    className={cx('user-avatar')}
                                                />
                                                <div className={cx('user-details')}>
                                                    <span className={cx('user-name')}>
                                                        {c.user.first_name} {c.user.last_name}
                                                    </span>
                                                    <span className={cx('comment-date')}>
                                                        {formatDate(c.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <p className={cx('comment-content')}>{c.content}</p>

                                        <div className={cx('comment-actions')}>
                                            {isAuthenticated ? (
                                                replyingTo !== c.id && (
                                                    <button
                                                        className={cx('reply-button')}
                                                        onClick={() => handleReplyClick(c.id)}
                                                    >
                                                        Reply
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    className={cx('reply-button', 'auth-required')}
                                                    onClick={() => setShowLoginPrompt(true)}
                                                >
                                                    Login to Reply
                                                </button>
                                            )}
                                        </div>

                                        {replyingTo === c.id && (
                                            <form onSubmit={handleReplySubmit} className={cx('reply-form')}>
                                                <textarea
                                                    id={`comment-reply-${c.id}`}
                                                    placeholder="Write a reply..."
                                                    rows="3"
                                                    className={cx('reply-input')}
                                                    required
                                                />
                                                <div className={cx('reply-actions')}>
                                                    <button type="submit" className={cx('reply-submit')}>
                                                        Post Reply
                                                    </button>
                                                    <button
                                                        className={cx('reply-cancel')}
                                                        onClick={handleCancelReplyClick}
                                                        type="button"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {c.replies && c.replies.length > 0 && (
                                            <div className={cx('replies-section')}>
                                                <div className={cx('replies-list')}>
                                                    {(expandedComments[c.id] ? c.replies : c.replies.slice(0, 2)).map((reply) => (
                                                        <div key={reply.id} className={cx('reply')}>
                                                            <div className={cx('reply-header')}>
                                                                <img
                                                                    src={reply.user.avatar || '/default-avatar.png'}
                                                                    alt={reply.user.username}
                                                                    className={cx('reply-avatar')}
                                                                />
                                                                <div className={cx('reply-user-details')}>
                                                                    <span className={cx('reply-user-name')}>
                                                                        {reply.user.first_name} {reply.user.last_name}
                                                                    </span>
                                                                    <span className={cx('reply-date')}>
                                                                        {formatDate(reply.created_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className={cx('reply-content')}>{reply.content}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {c.replies.length > 2 && (
                                                    <button
                                                        className={cx('expand-replies-button')}
                                                        onClick={() => toggleExpandReplies(c.id)}
                                                    >
                                                        {expandedComments[c.id]
                                                            ? `Hide ${c.replies.length - 2} replies`
                                                            : `Show ${c.replies.length - 2} more replies`}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className={cx('no-comments')}>
                                    {isAuthenticated ? (
                                        <p>No comments yet. Be the first to share your thoughts!</p>
                                    ) : (
                                        <div className={cx('no-comments-auth')}>
                                            <p>No comments yet.</p>
                                            <div className={cx('inline-auth')}>
                                                <RequireAuth onClose={() => {}} />
                                                <p>to be the first to share your thoughts!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section> */}
                </article>
            ) : (
                <div className={cx('not-found')}>
                    <h2>Article not found</h2>
                    <button onClick={() => navigate('/blog')} className={cx('back-button')}>
                        Back to Blog
                    </button>
                </div>
            )}
        </div>
    );
};

export default BlogDetail;