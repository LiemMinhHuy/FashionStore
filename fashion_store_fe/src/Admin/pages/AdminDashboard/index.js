import React from 'react';
import './AdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faFire, faUser, faTruck } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, BarElement, Title, Legend, LinearScale, ArcElement, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';

// Register necessary chart elements
ChartJS.register(CategoryScale, BarElement, Title, Tooltip, Legend, LinearScale, ArcElement);

function AdminDashboard() {
    // States for data fetching
    const [totalCategories, setTotalCategories] = useState(0);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [orders, setOrders] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalSales, setTotalSales] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [monthlySalesData, setMonthlySalesData] = useState({});
    const [donutChartData, setDonutChartData] = useState({
        labels: [],
        datasets: [
            {
                data: [],
                backgroundColor: [],
                borderWidth: 1,
            },
        ],
    });

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/orders/`);
                if (response.status === 200) {
                    setOrders(response.data.results);
                    setTotalOrders(response.data.count);
                    setTotalSales(response.data.total_sales);
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
    }, []);

    useEffect(() => {
        const fetchTotalCategories = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/categories/count/');
                if (response.ok) {
                    const data = await response.json(); // Chuyển đổi phản hồi thành JSON
                    setTotalCategories(data.total); // Sử dụng thuộc tính 'total'
                } else {
                    console.error('Error fetching total categories');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchTotalCategories();
    }, []);

    useEffect(() => {
        const fetchTotalproducts = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/products/count/');
                if (response.ok) {
                    const data = await response.json(); // Chuyển đổi phản hồi thành JSON
                    setTotalProducts(data.total); // Sử dụng thuộc tính 'total'
                } else {
                    console.error('Error fetching total products');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchTotalproducts();
    }, []);

    useEffect(() => {
        const fetchTotalusers = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/users/count/');
                if (response.ok) {
                    const data = await response.json(); // Chuyển đổi phản hồi thành JSON
                    setTotalUsers(data.total); // Sử dụng thuộc tính 'total'
                } else {
                    console.error('Error fetching total users');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchTotalusers();
    }, []);

    useEffect(() => {
        const fetchTotalOrders = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/orders/count/');
                if (response.ok) {
                    const data = await response.json(); // Chuyển đổi phản hồi thành JSON
                    setTotalOrders(data.total); // Sử dụng thuộc tính 'total'
                } else {
                    console.error('Error fetching total users');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        fetchTotalOrders();
    }, []);

    useEffect(() => {
        // Tính tổng doanh thu mỗi tháng từ orders
        const calculateMonthlySales = () => {
            const monthlySales = {}; //  Create empty monthly sales dictionary
            orders.forEach((order) => {
                const orderMonth = new Date(order.created_at).getMonth() + 1; // Extract month
                if (monthlySales[orderMonth]) {
                    monthlySales[orderMonth] += parseFloat(order.total_amount);
                } else {
                    monthlySales[orderMonth] = parseFloat(order.total_amount);
                }
            });
            setMonthlySalesData(monthlySales);
        };

        if (orders.length > 0) {
            calculateMonthlySales();
        }
    }, [orders]);

    const chartData = {
        labels: Object.keys(monthlySalesData).map((month) => `Tháng ${month}`),
        datasets: [
            {
                label: 'Doanh Thu',
                data: Object.values(monthlySalesData),
                backgroundColor: '#6395FF', // Blue color
                barPercentage: 0.5,
            },
        ],
    };

    useEffect(() => {
        const calculatePaymentStatusData = () => {
            const paymentStatusCounts = {};

            orders.forEach((order) => {
                const paymentStatus = order.payment_status; // Make sure your API data has 'payment_status'
                if (paymentStatusCounts[paymentStatus]) {
                    paymentStatusCounts[paymentStatus] += 1;
                } else {
                    paymentStatusCounts[paymentStatus] = 1;
                }
            });

            setDonutChartData({
                labels: Object.keys(paymentStatusCounts), // Extract unique payment statuses
                datasets: [
                    {
                        label: 'Payment Status',
                        data: Object.values(paymentStatusCounts), // Counts for each status
                        backgroundColor: [
                            '#6395FF', // Blue
                            '#FFCE56', // Yellow
                            '#FF8E72', // Red
                            '#44D673', // Green
                            '#D16B79', // Pink
                        ],
                        borderWidth: 1,
                    },
                ],
            });
        };

        if (orders.length > 0) {
            calculatePaymentStatusData();
        }
    }, [orders]);

    return (
        <div className={'Admind-container'}>
            <div className="main-content">
                {/* Project Section */}
                <div className="projects-section">
                    <h2 className="section-title">Fashion Store</h2>
                    <div className="projects-grid">
                        <div className="project-card">
                            <FontAwesomeIcon icon={faFire} />
                            <h3>Category</h3>
                            <span className="card-number">{totalCategories}</span>
                        </div>
                        <div className="project-card">
                            <FontAwesomeIcon icon={faDroplet} />
                            <h3>Product</h3>
                            <span className="card-number">{totalProducts}</span>
                        </div>
                        <div className="project-card">
                            <FontAwesomeIcon icon={faUser} />
                            <h3>User</h3>
                            <span className="card-number">{totalUsers}</span>
                        </div>
                        <div className="project-card">
                            <FontAwesomeIcon icon={faTruck} />
                            <h3>Order</h3>
                            <span className="card-number">{totalOrders}</span>
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <h2 className="section-title">Biểu đồ doanh thu hàng tháng</h2>
                    {Object.keys(monthlySalesData).length > 0 && <Bar data={chartData} />}
                </div>

                <div className="donut-chart-container">
                    <h2 className="section-title">Phân tích Trạng Thái Thanh Toán</h2>
                    {donutChartData.labels.length > 0 && <Doughnut data={donutChartData} />}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
