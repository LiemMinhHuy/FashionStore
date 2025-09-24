import React from 'react';
import styles from './Pagination.module.scss';

function Pagination({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    maxVisiblePages = 5,
    showFirstLast = true,
    showPrevNext = true 
}) {
    // Generate array of visible page numbers
    const getVisiblePages = () => {
        const visiblePages = [];
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            // Calculate start and end pages
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // Adjust if we're near the end
            if (endPage - startPage < maxVisiblePages - 1) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            // Add first page and ellipsis if needed
            if (startPage > 1) {
                visiblePages.push(1);
                if (startPage > 2) {
                    visiblePages.push('...');
                }
            }
            
            // Add visible pages
            for (let i = startPage; i <= endPage; i++) {
                visiblePages.push(i);
            }
            
            // Add ellipsis and last page if needed
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    visiblePages.push('...');
                }
                visiblePages.push(totalPages);
            }
        }
        
        return visiblePages;
    };

    const handlePageClick = (page) => {
        if (page !== '...' && page !== currentPage && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Always show pagination, even for single page

    const visiblePages = getVisiblePages();

    return (
        <nav className={styles.pagination} aria-label="Pagination Navigation">
            <ul className={styles.paginationList}>
                {/* First page button */}
                {showFirstLast && currentPage > 1 && (
                    <li className={styles.pageItem}>
                        <button
                            className={styles.pageLink}
                            onClick={() => handlePageClick(1)}
                            aria-label="Go to first page"
                        >
                            ≪
                        </button>
                    </li>
                )}

                {/* Previous button */}
                {showPrevNext && (
                    <li className={styles.pageItem}>
                        <button
                            className={`${styles.pageLink} ${currentPage === 1 ? styles.disabled : ''}`}
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            aria-label="Go to previous page"
                        >
                            &lt;
                        </button>
                    </li>
                )}

                {/* Page numbers */}
                {visiblePages.map((page, index) => (
                    <li 
                        key={`${page}-${index}`} 
                        className={`${styles.pageItem} ${page === currentPage ? styles.active : ''}`}
                    >
                        {page === '...' ? (
                            <span className={styles.ellipsis} aria-label="More pages">
                                {page}
                            </span>
                        ) : (
                            <button
                                className={styles.pageLink}
                                onClick={() => handlePageClick(page)}
                                aria-label={`Go to page ${page}`}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        )}
                    </li>
                ))}

                {/* Next button */}
                {showPrevNext && (
                    <li className={styles.pageItem}>
                        <button
                            className={`${styles.pageLink} ${currentPage === totalPages ? styles.disabled : ''}`}
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            aria-label="Go to next page"
                        >
                            &gt;
                        </button>
                    </li>
                )}

                {/* Last page button */}
                {showFirstLast && currentPage < totalPages && (
                    <li className={styles.pageItem}>
                        <button
                            className={styles.pageLink}
                            onClick={() => handlePageClick(totalPages)}
                            aria-label="Go to last page"
                        >
                            ≫
                        </button>
                    </li>
                )}
            </ul>
        </nav>
    );
}

export default Pagination;