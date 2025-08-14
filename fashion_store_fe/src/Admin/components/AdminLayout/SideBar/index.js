import React, { useState } from 'react';
import './SideBar.css'; // Import the CSS file
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const [isActive, setIsActive] = useState(false); // Manage dropdown state
    const location = useLocation(); // Get current location

    const toggleDropdown = (e) => {
        const parent = e.target.closest('.dropdown-item');
        if (parent) {
            const dropdownMenu = parent.querySelector('.dropdown-menu');
            dropdownMenu.classList.toggle('show');
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>FASHION STORE</h2>
            </div>
            <ul className="sidebar-menu">
                {/* Example Item (active by default) */}
                <li className={`sidebar-item ${location.pathname === '/admin/dashboard/' ? 'active' : ''}`}>
                    <Link to={'/admin/dashboard/'}>
                        <i className="fas fa-home"></i>
                        <span>Dashboard</span>
                    </Link>
                </li>

                {/* Dropdown Menu - Add category active */}
                <li
                    className={`sidebar-item dropdown-item ${
                        location.pathname.includes('/admin/category/') ? 'active' : ''
                    }`}
                >
                    <Link to={'/admin/category/'}>
                        <i className="fas fa-th-large"></i>
                        <span>Categories</span>
                        <i className="fas fa-angle-down"></i>
                    </Link>
                    {/* ... Submenu Items (e.g., Add Category, List Categories, etc.) ... */}
                </li>
                <li
                    className={`sidebar-item dropdown-item ${
                        location.pathname.includes('/admin/products/') ? 'active' : ''
                    }`}
                >
                    <Link to={'/admin/products/'}>
                        <i className="fas fa-th-large"></i>
                        <span>Products</span>
                        <i className="fas fa-angle-down"></i>
                    </Link>
                </li>
                <li
                    className={`sidebar-item dropdown-item ${
                        location.pathname.includes('/admin/user/') ? 'active' : ''
                    }`}
                >
                    <Link to={'/admin/user/'}>
                        <i className="fas fa-th-large"></i>
                        <span>Users</span>
                        <i className="fas fa-angle-down"></i>
                    </Link>
                </li>
                <li
                    className={`sidebar-item dropdown-item ${
                        location.pathname.includes('/admin/order/') ? 'active' : ''
                    }`}
                >
                    <Link to={'/admin/order/'}>
                        <i className="fas fa-th-large"></i>
                        <span>Orders</span>
                        <i className="fas fa-angle-down"></i>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
