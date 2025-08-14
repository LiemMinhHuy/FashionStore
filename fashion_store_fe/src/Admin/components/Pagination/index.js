import React, { useState } from 'react';
import './Pagination.css';

function Pagination({ totalPages, currentPage, onPageChange }) {
    const [activePage, setActivePage] = useState(currentPage);

    const handlePageChange = (page) => {
        setActivePage(page);
        onPageChange(page);
    };

    const showPageNumbers = () => {
        //  Kiểm tra điều kiện cho số trang hiển thị
        const maxVisiblePages = 5; // Hiển thị tối đa 5 trang
        const visiblePages = [];

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            // Hiển thị 3 trang trước, 1 trang hiện tại, 1 trang sau
            if (currentPage < 3) {
                visiblePages.push(1, 2, 3, 4, 5);
            } else if (currentPage >= totalPages - 2) {
                visiblePages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                visiblePages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
            }
        }

        //  Bổ sung button ellipsis
        if (visiblePages[0] > 1) {
            visiblePages.unshift('...');
        }
        if (visiblePages[visiblePages.length - 1] < totalPages) {
            visiblePages.push('...');
        }

        return visiblePages;
    };

    return (
        <nav aria-label="Page navigation example" className="pagination">
            <ul className="pagination-list">
                <li className="page-item">
                    <a
                        className="page-link"
                        onClick={() => handlePageChange(activePage - 1)}
                        disabled={activePage === 1}
                    >
                        <span aria-hidden="true">{'<'}</span>

                        <span className="sr-only">Previous</span>
                    </a>
                </li>

                {showPageNumbers().map((page, index) => (
                    <li
                        key={index} // Sử dụng index là key khi hiển thị string '...'
                        className={`page-item ${activePage === page ? 'active' : ''}`}
                    >
                        {/* Kiểm tra xem page là number hoặc ellipsis ('...') */}
                        {page === '...' ? (
                            <span className="page-link ellipsis">{page}</span>
                        ) : (
                            <a className="page-link" onClick={() => handlePageChange(page)}>
                                {page}
                            </a>
                        )}
                    </li>
                ))}

                {/* Button Next */}
                <li className="page-item">
                    <a
                        className="page-link"
                        onClick={() => handlePageChange(activePage + 1)}
                        disabled={activePage === totalPages}
                    >
                        <span aria-hidden="true">{'>'}</span>
                        <span className="sr-only">Next</span>
                    </a>
                </li>
            </ul>
        </nav>
    );
}

export default Pagination;
