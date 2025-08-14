import React, { useState, useEffect } from 'react';
import './AdminCategory.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Pagination from '~/Admin/components/Pagination'; // Import Pagination

function AdminCategory() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [totalPages, setTotalPages] = useState(1); // Tổng số trang

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/categories/?page=${currentPage}`);
                if (response.status === 200) {
                    setCategories(response.data.results);
                    setTotalPages(response.data.count); // Giả sử API trả về count
                } else {
                    setError('Error fetching categories.');
                }
            } catch (error) {
                setError('Error fetching categories.');
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [currentPage]);

    const handleDeleteCategory = async (categoryId) => {
        try {
            const response = await axios.delete(`http://127.0.0.1:8000/categories/${categoryId}/delete`);
            if (response.status === 200) {
                setCategories(categories.filter((category) => category.id !== categoryId));
                console.log('Category deleted successfully.');
            } else {
                setError('Error deleting category.');
            }
        } catch (error) {
            setError('Error deleting category. Please check your network.');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="admin-category-container">
            <h2>Danh Sách Danh Mục</h2>
            <table className="categories-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên Danh Mục</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => (
                        <tr key={category.id}>
                            <td>{category.id}</td>
                            <td>{category.name}</td>
                            <td>
                                <FontAwesomeIcon icon={faTrashCan} onClick={() => handleDeleteCategory(category.id)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
        </div>
    );
}

export default AdminCategory;
