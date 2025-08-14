import React, { useState, useEffect } from 'react';
import './AdminProducts.css';
import axios from 'axios';
import Pagination from '~/Admin/components/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';

function AdminProduct() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/products/?page=${currentPage}`);
                if (response.status === 200) {
                    setProducts(response.data.results);
                    setTotalPages(response.data.count); // Giả sử API trả về count
                } else {
                    setError('Error fetching products.');
                }
            } catch (error) {
                setError('Error fetching products.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [currentPage]);

    const handleDeleteProduct = async (productId) => {
        // Hiển thị cảnh báo xác nhận trước khi xóa
        const confirmDelete = window.confirm('Bạn có chắc muốn xóa sản phẩm này không?');
        if (!confirmDelete) {
            return;
        }

        try {
            const response = await axios.delete(`http://127.0.0.1:8000/products/${productId}/delete`);
            if (response.status === 204) {
                // Kiểm tra mã trạng thái 204 No Content
                setProducts(products.filter((product) => product.id !== productId));
                console.log('Product deleted successfully.');
            } else {
                setError('Error deleting product.');
            }
        } catch (error) {
            setError('Error deleting product. Please check your network.');
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
        <div className="admin-product-container">
            <h2>Danh Sách Sản Phẩm</h2>
            <table className="products-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên Sản Phẩm</th>
                        <th>Giá</th>
                        <th>Danh Mục</th>
                        <th>Số Lượng</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>{product.name}</td>
                            <td>${parseFloat(product.price).toFixed(2)}</td>
                            <td>{product.category.name}</td>
                            <td>{product.quantity}</td>
                            <td>
                                <FontAwesomeIcon icon={faTrashCan} onClick={() => handleDeleteProduct(product.id)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
        </div>
    );
}

export default AdminProduct;
