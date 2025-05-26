"use client";

import { useState, useEffect } from "react";
import { Table, Badge, Form, InputGroup, Alert } from "react-bootstrap";
import { orderAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await orderAPI.getAllOrders();
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleViewOrder = (order) => {
    setCurrentOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setFormSubmitting(true);
    try {
      const response = await orderAPI.updateOrderStatus(orderId, {
        status: newStatus,
      });

      // Update order in the list
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );

      if (currentOrder && currentOrder._id === orderId) {
        setCurrentOrder({ ...currentOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(
        error.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "delivered":
        return "success";
      case "shipping":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      case "unverified":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesSearch = searchQuery
      ? order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.userId.username.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "200px" }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fs-4 fw-bold mb-4">Orders</h1>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <InputGroup>
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by order ID or customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="col-md-6">
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="unverified">Unverified</option>
              <option value="pending">Pending</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </div>
        </div>
      </div>

      <Card>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      #
                      {order._id
                        ? order._id.substring(0, 8).toUpperCase()
                        : "N/A"}
                    </td>
                    <td>{order.userId.username}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>${order.totalAmount.toFixed(2)}</td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(order.status)}>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0"
                        onClick={() => handleViewOrder(order)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Order Details Modal */}
      {isModalOpen && currentOrder && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Order #
                  {currentOrder._id
                    ? currentOrder._id.substring(0, 8).toUpperCase()
                    : "N/A"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold">Customer Information</h6>
                    <p className="mb-1">Name: {currentOrder.userId.name}</p>
                    <p className="mb-1">Email: {currentOrder.userId.email}</p>
                    <p className="mb-0">
                      Username: {currentOrder.userId.username}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold">Order Information</h6>
                    <p className="mb-1">
                      Date: {formatDate(currentOrder.createdAt)}
                    </p>
                    <p className="mb-1">
                      Payment Method: {currentOrder.paymentMethod}
                    </p>
                    <p className="mb-0">
                      Status:{" "}
                      <Badge bg={getStatusBadgeVariant(currentOrder.status)}>
                        {currentOrder.status.charAt(0).toUpperCase() +
                          currentOrder.status.slice(1)}
                      </Badge>
                    </p>
                  </div>
                </div>

                <h6 className="fw-bold mb-3">Shipping Address</h6>
                <p className="mb-4">{currentOrder.shippingAddress}</p>

                <h6 className="fw-bold mb-3">Order Items</h6>
                <div className="table-responsive mb-4">
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-end">Price</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productId.name}</td>
                          <td className="text-end">${item.price.toFixed(2)}</td>
                          <td className="text-end">{item.quantity}</td>
                          <td className="text-end">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3" className="text-end">
                          Total:
                        </th>
                        <th className="text-end">
                          ${currentOrder.totalAmount.toFixed(2)}
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>

                <h6 className="fw-bold mb-3">Update Status</h6>
                <div className="d-flex gap-2">
                  <Button
                    variant={
                      currentOrder.status === "unverified"
                        ? "success"
                        : "outline-success"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(currentOrder._id, "unverified")
                    }
                    disabled={
                      currentOrder.status === "unverified" || formSubmitting
                    }
                  >
                    Unverified
                  </Button>
                  <Button
                    variant={
                      currentOrder.status === "pending"
                        ? "success"
                        : "outline-success"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(currentOrder._id, "pending")
                    }
                    disabled={
                      currentOrder.status === "pending" || formSubmitting
                    }
                  >
                    Pending
                  </Button>
                  <Button
                    variant={
                      currentOrder.status === "shipping"
                        ? "success"
                        : "outline-success"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(currentOrder._id, "shipping")
                    }
                    disabled={
                      currentOrder.status === "shipping" || formSubmitting
                    }
                  >
                    Shipping
                  </Button>
                  <Button
                    variant={
                      currentOrder.status === "delivered"
                        ? "success"
                        : "outline-success"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(currentOrder._id, "delivered")
                    }
                    disabled={
                      currentOrder.status === "delivered" || formSubmitting
                    }
                  >
                    Delivered
                  </Button>
                  <Button
                    variant={
                      currentOrder.status === "cancelled"
                        ? "danger"
                        : "outline-danger"
                    }
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(currentOrder._id, "cancelled")
                    }
                    disabled={
                      currentOrder.status === "cancelled" || formSubmitting
                    }
                  >
                    Cancelled
                  </Button>
                </div>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
