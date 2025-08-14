import React, { useState, useEffect } from 'react';
import './AdminUser.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Pagination from '~/Admin/components/Pagination';

function AdminUser() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/users/?page=${currentPage}`);
                if (response.status === 200) {
                    setUsers(response.data.results);
                    setTotalPages(response.data.count);
                } else {
                    setError('Error fetching users.');
                }
            } catch (error) {
                setError('Error fetching users.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentPage]);

    const handleDeleteUser = async (userId) => {
        //  Code tương tự như handleDeleteCategory
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
        <div className="admin-user-container">
            <h2>Danh Sách Người Dùng</h2>
            <table className="users-table">
                <thead>
                    <tr>
                        {/* Your columns */}
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Edit</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.first_name}</td>
                            <td>{user.last_name}</td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                                <FontAwesomeIcon icon={faTrashCan} onClick={() => handleDeleteUser(user.id)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} />
        </div>
    );
}

export default AdminUser;
