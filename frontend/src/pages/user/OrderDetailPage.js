"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Badge,
  Button,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { orderAPI } from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !id) return;

      setLoading(true);
      try {
        // Get all user orders
        const response = await orderAPI.getUserOrders();
        const orders = response.data.orders || [];

        // Find the specific order
        const foundOrder = orders.find((order) => order.id === id);

        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError("Order not found");
          toast.error("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await orderAPI.cancelOrder(id);

      // Update the order status in the UI
      setOrder({ ...order, status: "cancelled" });

      toast.success("Order cancelled successfully");
    } catch (err) {
      console.error("Error cancelling order:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to cancel order";
      toast.error(errorMessage);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm("Confirm that you have received this order?")) {
      return;
    }

    try {
      await orderAPI.confirmDelivery(id);

      // Update the order status in the UI
      setOrder({ ...order, status: "delivered" });

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
          <p>You need to be logged in to view order details.</p>
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

  if (error || !order) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error || "Order not found"}
        </div>
        <Button variant="primary" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button
        variant="outline-secondary"
        className="mb-4"
        onClick={() => navigate("/orders")}
      >
        &larr; Back to Orders
      </Button>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Order #{order.id.substring(0, 8)}...</h4>
          {getStatusBadge(order.status)}
        </Card.Header>

        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h5>Order Information</h5>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Payment Method:</strong> {order.paymentMethod}
              </p>
              <p>
                <strong>Status:</strong> {order.status}
              </p>
            </Col>

            <Col md={6}>
              <h5>Shipping Address</h5>
              <p>{order.shippingAddress}</p>
            </Col>
          </Row>

          <h5>Order Items</h5>
          <ListGroup className="mb-4">
            {order.items.map((item, index) => (
              <ListGroup.Item key={index}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {item.productId.image && (
                      <img
                        src={item.productId.image || "/placeholder.svg"}
                        alt={item.productId.name}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          marginRight: "15px",
                        }}
                        className="rounded"
                      />
                    )}
                    <div>
                      <h6 className="mb-0">{item.productId.name}</h6>
                      <small className="text-muted">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </small>
                    </div>
                  </div>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <Row>
            <Col md={6}>
              {order.status === "unverified" && (
                <Button variant="danger" onClick={handleCancelOrder}>
                  Cancel Order
                </Button>
              )}

              {order.status === "shipping" && (
                <Button variant="success" onClick={handleConfirmDelivery}>
                  Confirm Delivery
                </Button>
              )}
            </Col>

            <Col md={6}>
              <Card className="bg-light">
                <Card.Body>
                  <h5>Order Summary</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>

                  {order.discountApplied > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Discount:</span>
                      <span>-${order.discountApplied.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OrderDetailPage;
