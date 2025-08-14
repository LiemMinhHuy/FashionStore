// ButtonReply.jsx
import React, { useState } from 'react';
import styles from './ButtonReply.module.scss';
import classNames from 'classnames/bind';
import { authApi } from '~/utils/request';

const cx = classNames.bind(styles);

const ButtonReply = ({ newsId, parent_comment, onReplySubmit }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [reply, setReply] = useState('');

    // ... Form Input Code: A <textarea>, submit button, and cancel button
    const handleReplyChange = (e) => {
        setReply(e.target.value);
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (reply.trim()) {
            try {
                const response = await authApi(localStorage.getItem('access_token')).post(
                    `/comments/${newsId}/comment/`,
                    {
                        content: reply,
                        parent_comment: parent_comment,
                    },
                );

                // Success
                if (response.status === 201 && response.data) {
                    // Call the parent comment's `onReplySubmit` function
                    onReplySubmit(response.data);
                    setReply('');
                    setIsReplying(false);
                } else {
                    console.error('Error submitting reply:', response);
                }
            } catch (error) {
                console.error('Error submitting reply:', error);
            }
        }
    };

    // Render ButtonReply
    return (
        <div className={cx('reply-form-container')}>
            {!isReplying && (
                <button className={cx('reply-button')} onClick={() => setIsReplying(true)}>
                    Reply
                </button>
            )}

            {isReplying && (
                <div className={cx('reply-form')}>
                    <textarea
                        value={reply}
                        onChange={handleReplyChange}
                        placeholder="Write your reply..."
                        rows="2"
                        className={cx('comment-reply-input')}
                    />
                    <button type="submit" onClick={handleReplySubmit} className={cx('reply-submit')}>
                        Send
                    </button>
                    <button className={cx('reply-cancel')} onClick={() => setIsReplying(false)}>
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default ButtonReply;
