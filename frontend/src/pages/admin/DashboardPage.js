"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
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
    recentOrders: [],
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In a real app, you would have an endpoint for dashboard stats
        // For now, we'll fetch data from multiple endpoints and combine them
        const [usersResponse, productsResponse, ordersResponse] =
          await Promise.all([
            api.get("/api/user"),
            api.get("/api/product"),
            api.get("/api/order"),
          ]);

        const users = usersResponse.data.users || [];
        const products = productsResponse.data.products || [];
        const orders = ordersResponse.data.orders || [];

        // Calculate total revenue
        const totalRevenue = orders.reduce(
          (sum, order) => sum + order.totalAmount,
          0
        );

        // Get recent orders (last 5)
        const recentOrders = orders.slice(0, 5);

        // Mock top products (in a real app, this would be calculated from order data)
        const topProducts = products
          .slice(0, 5)
          .map((product) => ({
            ...product,
            salesCount: Math.floor(Math.random() * 100), // Random sales count for demo
          }))
          .sort((a, b) => b.salesCount - a.salesCount);

        setStats({
          totalUsers: users.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue,
          recentOrders,
          topProducts,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const salesData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Sales",
        data: [12, 19, 3, 5, 2, 3],
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.5)",
      },
    ],
  };

  const ordersData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Orders",
        data: [5, 10, 15, 8, 12, 9],
        backgroundColor: "rgba(249, 115, 22, 0.5)",
      },
    ],
  };

  const categoryData = {
    labels: ["Green Tea", "Black Tea", "Herbal Tea", "White Tea", "Oolong Tea"],
    datasets: [
      {
        label: "Products by Category",
        data: [12, 19, 3, 5, 2],
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
              <div className="bg-primary-100 rounded-circle p-3 me-3">
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
              <div className="bg-success-100 rounded-circle p-3 me-3">
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
              <div className="bg-info-100 rounded-circle p-3 me-3">
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
              <div className="bg-success-100 rounded-circle p-3 me-3">
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

      {/* Charts */}
      <div className="row g-4 mt-2">
        <div className="col-lg-6">
          <Card>
            <Card.Header className="bg-white">
              <h5 className="mb-0 fs-5">Sales Overview</h5>
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
              <h5 className="mb-0 fs-5">Orders Overview</h5>
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
                <Doughnut
                  data={categoryData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
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
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders && stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="text-decoration-none"
                          >
                            #{order.id ? order.id.substring(0, 8) : "N/A"}
                          </Link>
                        </td>
                        <td>{order.userId?.username || "N/A"}</td>
                        <td>${order.totalAmount?.toFixed(2) || "0.00"}</td>
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-3">
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
