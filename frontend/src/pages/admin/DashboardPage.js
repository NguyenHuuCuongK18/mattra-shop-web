// src/pages/DashboardPage.js
"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  authAPI,
  productAPI,
  orderAPI,
  subscriptionAPI,
} from "../../utils/api";
import Card from "../../components/ui/Card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Đăng ký ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalSubscribers: 0,
    recentOrders: [],
    productsByCategory: {},
    monthlyRevenue: { months: [], revenue: [] },
    ordersByStatus: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Lấy dữ liệu
        const [
          usersResponse,
          productsResponse,
          ordersResponse,
          subscriptionsResponse,
        ] = await Promise.all([
          authAPI.getAllUsers(),
          productAPI.getAllProducts(),
          orderAPI.getAllOrders(),
          subscriptionAPI.getSubscribedUsers(),
        ]);

        const users = usersResponse.data.users || [];
        const products = productsResponse.data.products || [];
        const orders = ordersResponse.data.orders || [];
        const subscribers = subscriptionsResponse.data.users || [];

        // Tính tổng doanh thu
        const totalRevenue = orders.reduce((sum, order) => {
          return sum + (order.totalAmount || 0);
        }, 0);

        // Lấy 10 đơn hàng mới nhất
        const recentOrders = orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);

        // Đếm đơn theo trạng thái
        const ordersByStatus = orders.reduce((acc, order) => {
          const status = order.status || "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Đếm sản phẩm theo danh mục
        const productsByCategory = products.reduce((acc, product) => {
          const categoryName = product.categories?.name || "Không phân loại";
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        }, {});

        // Tính doanh thu hàng tháng (6 tháng gần nhất)
        const monthlyRevenue = calculateMonthlyRevenue(orders);

        setStats({
          totalUsers: users.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          totalSubscribers: subscribers.length,
          recentOrders,
          productsByCategory,
          monthlyRevenue,
          ordersByStatus,
        });
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateMonthlyRevenue = (orders) => {
    const months = [];
    const revenue = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("vi-VN", { month: "short" });
      months.push(monthName);

      const monthRevenue = orders
        .filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      revenue.push(monthRevenue);
    }

    return { months, revenue };
  };

  // Dữ liệu cho biểu đồ doanh thu
  const salesData = {
    labels: stats.monthlyRevenue.months || [],
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: stats.monthlyRevenue.revenue || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        tension: 0.1,
      },
    ],
  };

  // Dữ liệu cho biểu đồ đơn hàng
  const ordersData = {
    labels: stats.monthlyRevenue.months || [],
    datasets: [
      {
        label: "Số đơn",
        data:
          stats.monthlyRevenue.months?.map((month, index) => {
            const now = new Date();
            const targetDate = new Date(
              now.getFullYear(),
              now.getMonth() - (5 - index),
              1
            );
            return stats.recentOrders.filter((order) => {
              const orderDate = new Date(order.createdAt);
              return (
                orderDate.getMonth() === targetDate.getMonth() &&
                orderDate.getFullYear() === targetDate.getFullYear()
              );
            }).length;
          }) || [],
        backgroundColor: "rgba(249, 115, 22, 0.5)",
      },
    ],
  };

  // Dữ liệu cho biểu đồ phân loại sản phẩm
  const categoryData = {
    labels: Object.keys(stats.productsByCategory),
    datasets: [
      {
        label: "Sản phẩm theo danh mục",
        data: Object.values(stats.productsByCategory),
        backgroundColor: [
          "rgba(34, 197, 94, 0.5)",
          "rgba(249, 115, 22, 0.5)",
          "rgba(59, 130, 246, 0.5)",
          "rgba(236, 72, 153, 0.5)",
          "rgba(168, 85, 247, 0.5)",
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(249, 115, 22)",
          "rgb(59, 130, 246)",
          "rgb(236, 72, 153)",
          "rgb(168, 85, 247)",
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fs-4 fw-bold mb-4">Bảng điều khiển</h1>

      {/* Cards thống kê */}
      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-people fs-4 text-primary"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Tổng người dùng</h6>
                <h3 className="mb-0 fs-4">{stats.totalUsers}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/users"
                className="text-decoration-none text-primary small"
              >
                Xem tất cả
              </Link>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-box-seam fs-4 text-success"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Tổng sản phẩm</h6>
                <h3 className="mb-0 fs-4">{stats.totalProducts}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/products"
                className="text-decoration-none text-primary small"
              >
                Xem tất cả
              </Link>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-cart-check fs-4 text-info"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Tổng đơn hàng</h6>
                <h3 className="mb-0 fs-4">{stats.totalOrders}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/orders"
                className="text-decoration-none text-primary small"
              >
                Xem tất cả
              </Link>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-currency-dollar fs-4 text-success"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Tổng doanh thu</h6>
                <h3 className="mb-0 fs-4">
                  {stats.totalRevenue.toLocaleString("vi-VN")} VND
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/orders"
                className="text-decoration-none text-primary small"
              >
                Xem chi tiết
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>

      {/* Thống kê phụ */}
      <div className="row g-4 mt-2">
        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-star fs-4 text-warning"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Đăng ký</h6>
                <h3 className="mb-0 fs-4">{stats.totalSubscribers}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/subscriptions"
                className="text-decoration-none text-primary small"
              >
                Xem tất cả
              </Link>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-exclamation-triangle fs-4 text-danger"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Đơn chờ xử lý</h6>
                <h3 className="mb-0 fs-4">
                  {stats.ordersByStatus.pending || 0}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <span className="text-muted small">Cần xử lý</span>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-truck fs-4 text-info"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Đang giao</h6>
                <h3 className="mb-0 fs-4">
                  {stats.ordersByStatus.shipping || 0}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <span className="text-muted small">Đang vận chuyển</span>
            </Card.Footer>
          </Card>
        </div>

        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-check-circle fs-4 text-success"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Đã giao</h6>
                <h3 className="mb-0 fs-4">
                  {stats.ordersByStatus.delivered || 0}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <span className="text-muted small">Hoàn thành</span>
            </Card.Footer>
          </Card>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Doanh thu 6 tháng gần nhất</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: "300px" }}>
                <Line
                  data={salesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) =>
                            value.toLocaleString("vi-VN") + " VND",
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-lg-6">
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Đơn hàng 6 tháng gần nhất</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: "300px" }}>
                <Bar
                  data={ordersData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="row g-4 mt-2">
        <div className="col-lg-4">
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Sản phẩm theo danh mục</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: "250px" }}>
                {Object.keys(stats.productsByCategory).length > 0 ? (
                  <Doughnut
                    data={categoryData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <span className="text-muted">Không có dữ liệu</span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-lg-8">
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Đơn hàng mới nhất</h5>
            </Card.Header>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order._id || order.id}>
                        <td>
                          <Link
                            to={`/admin/orders/${order._id || order.id}`}
                            className="text-decoration-none"
                          >
                            #{(order._id || order.id).substring(0, 8)}
                          </Link>
                        </td>
                        <td>
                          {order.userId?.name ||
                            order.userId?.username ||
                            "N/A"}
                        </td>
                        <td>
                          {(order.totalAmount || 0).toLocaleString("vi-VN") +
                            " VND"}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              order.status === "delivered"
                                ? "bg-success"
                                : order.status === "shipping"
                                ? "bg-info"
                                : order.status === "pending"
                                ? "bg-warning"
                                : order.status === "cancelled"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {order.status
                              ? order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)
                              : "Không xác định"}
                          </span>
                        </td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        Không có đơn hàng mới
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Card.Footer className="bg-light">
              <Link
                to="/admin/orders"
                className="text-decoration-none text-primary small"
              >
                Xem tất cả đơn hàng
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
