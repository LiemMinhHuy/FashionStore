import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './NewsDetail.module.scss';
import classNames from 'classnames/bind';
import axios from 'axios';
import { authApi } from '~/utils/request';

const cx = classNames.bind(styles);

const NewsDetail = () => {
    const { newsId } = useParams();
    const [newsItem, setNewsItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});

    const fetchNewsDetail = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/news/${newsId}/`);
            setNewsItem(response.data); // Sửa ở đây
        } catch (err) {
            console.error('Lỗi xảy ra:', err);
            setError('Lỗi xảy ra khi lấy chi tiết tin tức.');
        } finally {
            setLoading(false);
        }
    }, [newsId]);

    const fetchComments = useCallback(async () => {
        try {
            const response = await authApi(localStorage.getItem('access_token')).get(`news/${newsId}/add-comments/`);
            if (response.data && Array.isArray(response.data)) {
                setComments(response.data);
            } else {
                console.error('Comments response is not in expected format:', response);
                setError('Unexpected format for comments.');
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
            setError('An error occurred while fetching comments.');
        }
    }, [newsId]);

    const handleCommentChange = (e) => {
        setComment(e.target.value);
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (comment.trim()) {
            try {
                const parentId = replyingTo !== null ? replyingTo : null;
                const response = await authApi(localStorage.getItem('access_token')).post(
                    `news/${newsId}/add-comments/`,
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
                    console.error('Phản hồi không hợp lệ sau khi gửi bình luận:', response);
                    setError('Lỗi xảy ra khi gửi bình luận.');
                }
                setComment('');
                setReplyingTo(null);
            } catch (err) {
                console.error('Lỗi gửi bình luận:', err);
                setError('Lỗi xảy ra khi gửi bình luận.');
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
        if (replyingTo === null) return;

        const parentCommentId = replyingTo;
        const content = document.getElementById(`comment-reply-${parentCommentId}`).value.trim();

        if (!content) return;

        try {
            const response = await authApi(localStorage.getItem('access_token')).post(
                `news/${newsId}/add-comments/`, // Sửa endpoint nếu cần
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
                setError('Lỗi xảy ra khi gửi phản hồi.');
            }
        } catch (error) {
            console.error('Error submitting reply:', error);
            setError('Lỗi xảy ra khi gửi phản hồi.');
        }
    };

    const toggleExpandReplies = (commentId) => {
        setExpandedComments((prevExpandedComments) => ({
            ...prevExpandedComments,
            [commentId]: !prevExpandedComments[commentId],
        }));
    };

    useEffect(() => {
        fetchNewsDetail();
        fetchComments();
    }, [fetchNewsDetail, fetchComments]);

    if (loading) return <h2>Đang tải chi tiết tin tức...</h2>;
    if (error) return <h2>Lỗi: {error}</h2>;

    return (
        <div className={cx('news-detail')}>
            {newsItem ? (
                <>
                    <h2>{newsItem.title}</h2>
                    <img
                        src={
                            newsItem.image
                                ? newsItem.image.replace('image/upload/https://', 'https://')
                                : 'https://res.cloudinary.com/ddoebyozj/image/upload/f_auto,q_auto/cld-sample-5'
                        }
                        alt={newsItem.title}
                    />
                    <p>{newsItem.content}</p>

                    <div className={cx('comments-section')}>
                        <h3>Bình luận</h3>
                        <form onSubmit={handleCommentSubmit} className={cx('comment-form')}>
                            <textarea
                                value={comment}
                                onChange={handleCommentChange}
                                placeholder="Viết bình luận..."
                                rows="4"
                                className={cx('comment-input')}
                            />
                            <button type="submit" className={cx('comment-submit')}>
                                Gửi
                            </button>
                        </form>

                        <div className={cx('comments-list')}>
                            {comments.length > 0 ? (
                                comments.map((c) => (
                                    <div key={c.id} className={cx('comment')}>
                                        <div className={cx('user')}>
                                            <img
                                                src={c.user.avatar}
                                                alt={c.user.username}
                                                className={cx('user-avatar')}
                                            />
                                            <div className={cx('comment-user')}>
                                                <p className={cx('comment-name')}>
                                                    {c.user.first_name} {c.user.last_name}
                                                </p>
                                                {' - '}
                                                {new Date(c.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        <p className={cx('comment-content')}>{c.content}</p>

                                        {replyingTo === c.id && (
                                            <form onSubmit={handleReplySubmit} className={cx('reply-form')}>
                                                <textarea
                                                    id={`comment-reply-${c.id}`}
                                                    placeholder="Viết phản hồi..."
                                                    rows="2"
                                                    className={cx('comment-reply-input')}
                                                />
                                                <button type="submit" className={cx('reply-submit')}>
                                                    Gửi
                                                </button>
                                                <button
                                                    className={cx('reply-cancel')}
                                                    onClick={handleCancelReplyClick}
                                                    type="button"
                                                >
                                                    Hủy
                                                </button>
                                            </form>
                                        )}

                                        {replyingTo !== c.id && (
                                            <button
                                                className={cx('reply-button')}
                                                onClick={() => handleReplyClick(c.id)}
                                            >
                                                Trả lời
                                            </button>
                                        )}

                                        {c.replies && c.replies.length > 0 && (
                                            <div className={cx('child-comments')}>
                                                {expandedComments[c.id]
                                                    ? c.replies.map((reply) => (
                                                          <div key={reply.id} className={cx('child-comment')}>
                                                              <div className={cx('user')}>
                                                                  <img
                                                                      src={reply.user.avatar}
                                                                      alt={reply.user.username}
                                                                      className={cx('user-avatar')}
                                                                  />
                                                                  <div className={cx('comment-user')}>
                                                                      <p className={cx('comment-name')}>
                                                                          {reply.user.first_name} {reply.user.last_name}
                                                                      </p>
                                                                      {' - '}
                                                                      {new Date(reply.created_at).toLocaleString()}
                                                                  </div>
                                                              </div>
                                                              <p className={cx('comment-content')}>{reply.content}</p>
                                                          </div>
                                                      ))
                                                    : c.replies.slice(0, 2).map((reply) => (
                                                          <div key={reply.id} className={cx('child-comment')}>
                                                              <div className={cx('user')}>
                                                                  <img
                                                                      src={reply.user.avatar}
                                                                      alt={reply.user.username}
                                                                      className={cx('user-avatar')}
                                                                  />
                                                                  <div className={cx('comment-user')}>
                                                                      <p className={cx('comment-name')}>
                                                                          {reply.user.first_name} {reply.user.last_name}
                                                                      </p>
                                                                      {' - '}
                                                                      {new Date(reply.created_at).toLocaleString()}
                                                                  </div>
                                                              </div>
                                                              <p className={cx('comment-content')}>{reply.content}</p>
                                                          </div>
                                                      ))}

                                                {c.replies.length > 2 && (
                                                    <button
                                                        className={cx('expand-button')}
                                                        onClick={() => toggleExpandReplies(c.id)}
                                                    >
                                                        {expandedComments[c.id]
                                                            ? 'Thu gọn bình luận con'
                                                            : 'Xem tất cả bình luận con'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>Chưa có bình luận nào.</p>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <p>Không tìm thấy tin tức.</p>
            )}
        </div>
    );
};

export default NewsDetail;
