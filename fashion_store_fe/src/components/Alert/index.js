import React, { useEffect } from 'react';
import styles from './Alert.module.scss';
import classNames from 'classnames/bind';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';


const cx = classNames.bind(styles);

const icons = {
  success: (
    <CheckCircleIcon className={cx('icon')} />
  ),
  error: (
    <ExclamationCircleIcon className={cx('icon')} />
  ),
  info: (
    <InformationCircleIcon className={cx('icon')} />
  ),
  warning: (
    <ExclamationTriangleIcon className={cx('icon')} />
  ),
};

const Alert = ({ type = 'info', message, onClose, link, className, autoClose = false, autoCloseTime = 2000 }) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseTime);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);

  return (
    <div className={cx('alert', type, className)} role="alert">
      {icons[type]}
      <div className={cx('message')}>
        {message}
        {link && (
          <a href={link.href} className={cx('link')}>
            {link.text}
          </a>
        )}
      </div>
      {onClose && (
        <button type="button" className={cx('close-btn')} onClick={onClose} aria-label="Close">
          <XMarkIcon className={cx('close-icon')} />
        </button>
      )}
    </div>
  );
};

export default Alert;