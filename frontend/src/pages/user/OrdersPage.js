"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Badge,
  Button,
  Spinner,
  Modal,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { orderAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await orderAPI.getMyOrders();
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders");
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Open the confirmation modal
  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  };

  // Close modal without cancelling
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelOrderId(null);
  };

  // Actually cancel the order
  const confirmCancelOrder = async () => {
    try {
      await orderAPI.cancelOrder(cancelOrderId);
      setOrders(
        orders.map((order) =>
          order._id === cancelOrderId
            ? { ...order, status: "cancelled" }
            : order
        )
      );
      toast.success("Order cancelled successfully");
    } catch (err) {
      console.error("Error cancelling order:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to cancel order";
      toast.error(errorMessage);
    } finally {
      closeCancelModal();
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm("Confirm that you have received this order?")) {
      return;
    }
    try {
      await orderAPI.confirmDelivery(orderId);
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "delivered" } : order
        )
      );
      toast.success("Delivery confirmed successfully");
    } catch (err) {
      console.error("Error confirming delivery:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to confirm delivery";
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    let variant;
    switch (status) {
      case "unverified":
        variant = "warning";
        break;
      case "pending":
        variant = "info";
        break;
      case "shipping":
        variant = "primary";
        break;
      case "delivered":
        variant = "success";
        break;
      case "cancelled":
        variant = "danger";
        break;
      default:
        variant = "secondary";
    }
    return <Badge bg={variant}>{status}</Badge>;
  };

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>Please Login</h2>
          <p>You need to be logged in to view your orders.</p>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container className="py-5">
        <h1 className="mb-4">My Orders</h1>
        <div className="text-center py-5">
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet.</p>
          <Button variant="primary" as={Link} to="/products">
            Browse Products
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-5">
        <h1 className="mb-4">My Orders</h1>
        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-decoration-none"
                  >
                    {order._id.substring(0, 8)}...
                  </Link>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      as={Link}
                      to={`/orders/${order._id}`}
                    >
                      View
                    </Button>

                    {order.status === "unverified" && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openCancelModal(order._id)}
                      >
                        Cancel
                      </Button>
                    )}

                    {order.status === "shipping" && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleConfirmDelivery(order._id)}
                      >
                        Confirm Delivery
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>

      {/* Cancel Confirmation Modal */}
      <Modal show={showCancelModal} onHide={closeCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to cancel this order?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCancelModal}>
            Close
          </Button>
          <Button variant="danger" onClick={confirmCancelOrder}>
            Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrdersPage;
