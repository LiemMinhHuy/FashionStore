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
        if (category === 'Clothing' || category === 'Accessories') {
            fetchCategories(category); // Gọi API lấy danh sách category
            setDialogOpen(true); // Mở hộp thoại khi nhấn vào "Clothing" hoặc "Accessories"
        } else {
            setDialogOpen(false);
        }
    };

    // Hàm gọi API lấy danh sách category cho Collections
    const fetchCategories = async (categoryType) => {
        setLoading(true);
        try {
            const page = categoryType === 'Clothing' ? 1 : 2; // Chọn trang dựa trên loại category
            const result = await CategoryList.category(page);
            console.log('Fetched categories:', result.results);
            setCategory(result.results || []); // Đặt category từ API
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
            <div className={cx('category', { active: activeCategory === 'Clothing' })}>
                <div onClick={() => handleCategoryClick('Clothing')}>
                    <p>Clothing</p>
                </div>

                {isDialogOpen && activeCategory === 'Clothing' && (
                    <HeadlessTippy
                        interactive
                        visible={isDialogOpen}
                        onClickOutside={() => setDialogOpen(false)}
                        render={(attrs) => (
                            <div className={cx('cate-list')} tabIndex="-1" {...attrs}>
                                <PopperWrapper>
                                    <h4 className={cx('title')}>Clothing</h4>
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

            <div className={cx('category', { active: activeCategory === 'Accessories' })}>
                <div onClick={() => handleCategoryClick('Accessories')}>
                    <p>Accessories</p>
                </div>

                {isDialogOpen && activeCategory === 'Accessories' && (
                    <HeadlessTippy
                        interactive
                        visible={isDialogOpen}
                        onClickOutside={() => setDialogOpen(false)}
                        render={(attrs) => (
                            <div className={cx('cate-list')} tabIndex="-1" {...attrs}>
                                <PopperWrapper>
                                    <h4 className={cx('title')}>Accessories</h4>
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
                <p>New</p>
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
