import React, { useState } from 'react';
import styles from './SideBar.module.scss';
import classNames from 'classnames/bind';
import HeadlessTippy from '@tippyjs/react/headless';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import ProductItem from '~/components/ProductItem';
import * as CategoryList from '~/api/categoryList';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function SideBar() {
    const [activeCategory, setActiveCategory] = useState('Home');
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [category, setCategory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Hàm xử lý nhấn vào mục
    const handleCategoryClick = (category) => {
        setActiveCategory(category);
        if (category === 'Shop') {
            fetchCategories();
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    };

    // Hàm gọi API lấy danh sách category cho Collections
    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Giả sử có 2 page, bạn có thể fetch song song:
            const [result1, result2] = await Promise.all([
                CategoryList.category(1),
                CategoryList.category(2),
            ]);
            setCategory([...(result1.results || []), ...(result2.results || [])]);
        } catch (error) {
            console.log('Error fetching category:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className={cx('wrapper')}>
            <Link to={'/'}>
                <div
                    className={cx('category', { active: activeCategory === 'Home' })}
                    onClick={() => handleCategoryClick('Home')}
                >
                    <p>Home</p>
                </div>
            </Link>
            <div className={cx('category', { active: activeCategory === 'Shop' })}>
                <div onClick={() => handleCategoryClick('Shop')}>
                    <p>Shop</p>
                </div>
                {isDialogOpen && activeCategory === 'Shop' && (
                    <HeadlessTippy
                        interactive
                        visible={isDialogOpen}
                        onClickOutside={() => setDialogOpen(false)}
                        render={(attrs) => (
                            <div className={cx('cate-list')} tabIndex="-1" {...attrs}>
                                <PopperWrapper>
                                    <h4 className={cx('title')}>Shop</h4>
                                    {loading && <p>Loading category...</p>}
                                    {!loading && category.length === 0 && <p>No category found</p>}
                                    {category.map((cate) => (
                                        <ProductItem key={cate.id} data={cate} />
                                    ))}
                                </PopperWrapper>
                            </div>
                        )}
                    >
                        <div />
                    </HeadlessTippy>
                )}
            </div>

            <div
                className={cx('category', { active: activeCategory === 'New' })}
                onClick={() => handleCategoryClick('New')}
            >
                <Link to={'/news'}>
                    {' '}
                    <p>News</p>
                </Link>
            </div>

            <div
                className={cx('category', { active: activeCategory === 'Contact' })}
                onClick={() => handleCategoryClick('Contact')}
            >
                <p>Contact</p>
            </div>
        </aside>
    );
}

export default SideBar;
