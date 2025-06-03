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
        const response = await orderAPI.getUserOrders();
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error("Lỗi khi tải đơn hàng:", err);
        setError("Không thể tải đơn hàng");
        toast.error("Không thể tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Mở modal xác nhận hủy đơn
  const openCancelModal = (orderId) => {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  };

  // Đóng modal mà không hủy
  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelOrderId(null);
  };

  // Thực hiện hủy đơn
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
      toast.success("Đã hủy đơn thành công");
    } catch (err) {
      console.error("Lỗi khi hủy đơn:", err);
      const errorMessage = err.response?.data?.message || "Không thể hủy đơn";
      toast.error(errorMessage);
    } finally {
      closeCancelModal();
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm("Xác nhận rằng bạn đã nhận được đơn này?")) {
      return;
    }
    try {
      await orderAPI.confirmDelivery(orderId);
      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "delivered" } : order
        )
      );
      toast.success("Xác nhận nhận hàng thành công");
    } catch (err) {
      console.error("Lỗi khi xác nhận nhận hàng:", err);
      const errorMessage =
        err.response?.data?.message || "Không thể xác nhận nhận hàng";
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    let variant, label;
    switch (status) {
      case "unverified":
        variant = "warning";
        label = "Chưa xác nhận";
        break;
      case "pending":
        variant = "info";
        label = "Đang chờ";
        break;
      case "shipping":
        variant = "primary";
        label = "Đang giao";
        break;
      case "delivered":
        variant = "success";
        label = "Đã giao";
        break;
      case "cancelled":
        variant = "danger";
        label = "Đã hủy";
        break;
      default:
        variant = "secondary";
        label = status;
    }
    return <Badge bg={variant}>{label}</Badge>;
  };

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập để xem đơn hàng.</p>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Đăng nhập
          </Button>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Đang tải...</span>
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
        <h1 className="mb-4">Đơn hàng của tôi</h1>
        <div className="text-center py-5">
          <h3>Chưa có đơn hàng</h3>
          <p>Bạn chưa đặt đơn hàng nào.</p>
          <Button variant="primary" as={Link} to="/products">
            Xem sản phẩm
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-5">
        <h1 className="mb-4">Đơn hàng của tôi</h1>
        <Table responsive striped hover>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
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
                <td>
                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </td>
                <td>{order.totalAmount.toLocaleString("vi-VN")} VND</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      as={Link}
                      to={`/orders/${order._id}`}
                    >
                      Xem
                    </Button>

                    {order.status === "unverified" && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openCancelModal(order._id)}
                      >
                        Hủy đơn
                      </Button>
                    )}

                    {order.status === "shipping" && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleConfirmDelivery(order._id)}
                      >
                        Xác nhận đã nhận
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>

      {/* Modal xác nhận hủy đơn */}
      <Modal show={showCancelModal} onHide={closeCancelModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận hủy đơn</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn hủy đơn này?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeCancelModal}>
            Đóng
          </Button>
          <Button variant="danger" onClick={confirmCancelOrder}>
            Hủy đơn
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrdersPage;
