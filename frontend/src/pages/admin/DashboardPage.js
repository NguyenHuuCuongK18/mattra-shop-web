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

// Register ChartJS components
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
    topProducts: [],
    monthlyRevenue: [],
    ordersByStatus: {},
    productsByCategory: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all required data
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

        // Calculate total revenue
        const totalRevenue = orders.reduce((sum, order) => {
          return sum + (order.totalAmount || 0);
        }, 0);

        // Get recent orders (last 10)
        const recentOrders = orders
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);

        // Calculate orders by status
        const ordersByStatus = orders.reduce((acc, order) => {
          const status = order.status || "unknown";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        // Calculate products by category
        const productsByCategory = products.reduce((acc, product) => {
          const categoryName = product.categories?.name || "Uncategorized";
          acc[categoryName] = (acc[categoryName] || 0) + 1;
          return acc;
        }, {});

        // Calculate monthly revenue (last 6 months)
        const monthlyRevenue = calculateMonthlyRevenue(orders);

        // Get top products (by order frequency - simplified calculation)
        const productOrderCount = orders.reduce((acc, order) => {
          if (order.items) {
            order.items.forEach((item) => {
              const productId = item.productId?._id || item.productId;
              if (productId) {
                acc[productId] = (acc[productId] || 0) + item.quantity;
              }
            });
          }
          return acc;
        }, {});

        const topProducts = products
          .map((product) => ({
            ...product,
            salesCount: productOrderCount[product._id] || 0,
          }))
          .sort((a, b) => b.salesCount - a.salesCount)
          .slice(0, 5);

        setStats({
          totalUsers: users.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          totalSubscribers: subscribers.length,
          recentOrders,
          topProducts,
          monthlyRevenue,
          ordersByStatus,
          productsByCategory,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
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
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
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

  // Prepare chart data
  const salesData = {
    labels: stats.monthlyRevenue.months || [],
    datasets: [
      {
        label: "Revenue ($)",
        data: stats.monthlyRevenue.revenue || [],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const ordersData = {
    labels: stats.monthlyRevenue.months || [],
    datasets: [
      {
        label: "Orders",
        data:
          stats.monthlyRevenue.months?.map((month) => {
            const now = new Date();
            const monthIndex = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].indexOf(month);
            const targetDate = new Date(
              now.getFullYear(),
              now.getMonth() - (5 - stats.monthlyRevenue.months.indexOf(month)),
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

  const categoryData = {
    labels: Object.keys(stats.productsByCategory),
    datasets: [
      {
        label: "Products by Category",
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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fs-4 fw-bold mb-4">Dashboard</h1>

      {/* Stats Cards */}
      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-people fs-4 text-primary"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Total Users</h6>
                <h3 className="mb-0 fs-4">{stats.totalUsers}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/users"
                className="text-decoration-none text-primary small"
              >
                View all
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
                <h6 className="text-muted mb-1 small">Total Products</h6>
                <h3 className="mb-0 fs-4">{stats.totalProducts}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/products"
                className="text-decoration-none text-primary small"
              >
                View all
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
                <h6 className="text-muted mb-1 small">Total Orders</h6>
                <h3 className="mb-0 fs-4">{stats.totalOrders}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/orders"
                className="text-decoration-none text-primary small"
              >
                View all
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
                <h6 className="text-muted mb-1 small">Total Revenue</h6>
                <h3 className="mb-0 fs-4">${stats.totalRevenue.toFixed(2)}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/orders"
                className="text-decoration-none text-primary small"
              >
                View details
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="row g-4 mt-2">
        <div className="col-md-6 col-lg-3">
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                <i className="bi bi-star fs-4 text-warning"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1 small">Subscribers</h6>
                <h3 className="mb-0 fs-4">{stats.totalSubscribers}</h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <Link
                to="/admin/subscriptions"
                className="text-decoration-none text-primary small"
              >
                View all
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
                <h6 className="text-muted mb-1 small">Pending Orders</h6>
                <h3 className="mb-0 fs-4">
                  {stats.ordersByStatus.pending || 0}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <span className="text-muted small">Requires attention</span>
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
                <h6 className="text-muted mb-1 small">Shipping Orders</h6>
                <h3 className="mb-0 fs-4">
                  {stats.ordersByStatus.shipping || 0}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <span className="text-muted small">In transit</span>
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
                <h6 className="text-muted mb-1 small">Delivered Orders</h6>
                <h3 className="mb-0 fs-4">
                  {stats.ordersByStatus.delivered || 0}
                </h3>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light border-0">
              <span className="text-muted small">Completed</span>
            </Card.Footer>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Revenue Overview (Last 6 Months)</h5>
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
                          callback: (value) => "$" + value,
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
              <h5 className="mb-0 fs-5">Orders Overview (Last 6 Months)</h5>
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
              <h5 className="mb-0 fs-5">Products by Category</h5>
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
                    <span className="text-muted">No data available</span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-lg-8">
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Recent Orders</h5>
            </Card.Header>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
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
                        <td>${(order.totalAmount || 0).toFixed(2)}</td>
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
                              : "Unknown"}
                          </span>
                        </td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-3">
                        No recent orders
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
                View all orders
              </Link>
            </Card.Footer>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
