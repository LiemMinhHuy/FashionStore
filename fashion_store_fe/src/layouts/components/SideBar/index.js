import React, { useState } from 'react';
import styles from './SideBar.module.scss';
import classNames from 'classnames/bind';
import HeadlessTippy from '@tippyjs/react/headless';
import { Wrapper as PopperWrapper } from '~/components/Popper';
import ProductItem from '~/components/ProductItem';
import * as CategoryList from '~/api/categoryList';
import { Link, useLocation } from 'react-router-dom';

const cx = classNames.bind(styles);

function SideBar() {
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [category, setCategory] = useState([]);
	const [loading, setLoading] = useState(false);

	const location = useLocation();
	const pathname = location.pathname || '/';
	const isHome = pathname === '/';
	const isNews = pathname.startsWith('/news');
	const isShop = pathname.startsWith('/products');

	// Hàm xử lý nhấn vào mục
	const handleShopClick = () => {
		fetchCategories();
		setDialogOpen(true);
	};

	// Hàm gọi API lấy danh sách category cho Collections
	const fetchCategories = async () => {
		setLoading(true);
		try {
			const result = await CategoryList.category();
			setCategory(result.results || []);
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
					className={cx('category', { active: isHome })}
				>
					<p>Home</p>
				</div>
			</Link>
			<div className={cx('category', { active: isShop })}>
				<div onClick={handleShopClick}>
					<p>Shop</p>
				</div>
				{isDialogOpen && (
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
				className={cx('category', { active: isNews })}
			>
				<Link to={'/news'}>
					{' '}
					<p>News</p>
				</Link>
			</div>

			<div
				className={cx('category', { active: pathname.startsWith('/contact') })}
			>
				<p>Contact</p>
			</div>
		</aside>
	);
}

export default SideBar;
