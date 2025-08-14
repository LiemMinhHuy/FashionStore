import React, { useState, useEffect } from 'react';
import './AdminOrder.css'; // Đảm bảo đường dẫn đúng tới file CSS
import { authApi } from '~/utils/request';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Pagination from '~/Admin/components/Pagination';

function AdminOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(
                    `http://127.0.0.1:8000/orders/?page=${currentPage}`, //  Đường dẫn API
                );
                if (response.status === 200) {
                    setOrders(response.data.results);
                    setTotalPages(response.data.count);
                } else {
                    setError('Error fetching orders.');
                }
            } catch (error) {
                setError('Error fetching orders.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage]);

    const handleDeleteOrder = async (orderId) => {
        try {
            const response = await authApi(localStorage.getItem('access_token')).delete(
                `http://127.0.0.1:8000/orders/${orderId}/delete/`,
            );
            if (response.status === 200) {
                setOrders(orders.filter((order) => order.id !== orderId));
                console.log('Order deleted successfully.');
            } else {
                setError(`Error deleting order: ${response.statusText}`);
            }
        } catch (error) {
            setError('Error deleting order. Please check your network.');
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
        <div className="admin-order-container">
            <h2>Danh Sách Đơn Hàng</h2>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Khách Hàng</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                        <th>Phương thức Thanh Toán</th>
                        <th>Địa chỉ Giao hàng</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>
                                {order.customer ? (
                                    <>
                                        {order.customer.first_name} {order.customer.last_name}
                                    </>
                                ) : (
                                    'Khách không xác định' // Trường hợp không có thông tin người dùng
                                )}
                            </td>
                            <td>${parseFloat(order.total_amount).toFixed(2)}</td>
                            <td>{order.payment_status}</td>
                            <td>{order.payment_method}</td>
                            <td>{order.shipping_address}</td>
                            <td>
                                <FontAwesomeIcon
                                    icon={faTrashCan}
                                    onClick={() => handleDeleteOrder(order.id)}
                                    style={{ cursor: 'pointer', color: 'red' }}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
        </div>
    );
}

export default AdminOrder;
