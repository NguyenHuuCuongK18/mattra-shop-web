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
  Alert,
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
        const response = await orderAPI.getUserOrders();
        const orders = response.data.orders || [];

        const foundOrder = orders.find((o) => o.id === id);

        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError("Không tìm thấy đơn hàng");
          toast.error("Không tìm thấy đơn hàng");
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết đơn hàng:", err);
        setError("Không thể tải chi tiết đơn hàng");
        toast.error("Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn này?")) {
      return;
    }

    try {
      await orderAPI.cancelOrder(id);
      setOrder({ ...order, status: "cancelled" });
      toast.success("Đã hủy đơn thành công");
    } catch (err) {
      console.error("Lỗi khi hủy đơn:", err);
      const errorMessage = err.response?.data?.message || "Không thể hủy đơn";
      toast.error(errorMessage);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm("Xác nhận rằng bạn đã nhận được đơn này?")) {
      return;
    }

    try {
      await orderAPI.confirmDelivery(id);
      setOrder({ ...order, status: "delivered" });
      toast.success("Xác nhận đã nhận thành công");
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
          <p>Bạn cần đăng nhập để xem chi tiết đơn hàng.</p>
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

  if (error || !order) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error || "Không tìm thấy đơn hàng"}
        </div>
        <Button variant="primary" onClick={() => navigate("/orders")}>
          Quay lại Đơn hàng
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
        &larr; Quay lại Đơn hàng
      </Button>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Đơn hàng #{order.id.substring(0, 8)}...</h4>
          {getStatusBadge(order.status)}
        </Card.Header>

        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h5>Thông tin đơn hàng</h5>
              <p>
                <strong>Ngày:</strong>{" "}
                {new Date(order.createdAt).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                <strong>Phương thức thanh toán:</strong> {order.paymentMethod}
              </p>
              <p>
                <strong>Trạng thái:</strong>{" "}
                {order.status === "unverified"
                  ? "Chưa xác nhận"
                  : order.status === "pending"
                  ? "Đang chờ"
                  : order.status === "shipping"
                  ? "Đang giao"
                  : order.status === "delivered"
                  ? "Đã giao"
                  : order.status === "cancelled"
                  ? "Đã hủy"
                  : order.status}
              </p>
            </Col>

            <Col md={6}>
              <h5>Địa chỉ giao hàng</h5>
              {/* <-- Thông báo bổ sung --> */}
              <Alert variant="warning" className="mb-3">
                <i className="bi bi-exclamation-circle me-2"></i>
                <strong>
                  Các sản phẩm đồ uống hiện chỉ hỗ trợ ship ở khu vực Hòa Lạc
                </strong>
              </Alert>
              {/* <-- Kết thúc thông báo --> */}
              <p>{order.shippingAddress}</p>
            </Col>
          </Row>

          <h5>Sản phẩm đã đặt</h5>
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
                        {item.price.toLocaleString("vi-VN")} VND x{" "}
                        {item.quantity}
                      </small>
                    </div>
                  </div>
                  <span>
                    {(item.price * item.quantity).toLocaleString("vi-VN")} VND
                  </span>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>

          <Row>
            <Col md={6}>
              {order.status === "unverified" && (
                <Button variant="danger" onClick={handleCancelOrder}>
                  Hủy đơn
                </Button>
              )}

              {order.status === "shipping" && (
                <Button variant="success" onClick={handleConfirmDelivery}>
                  Xác nhận đã nhận
                </Button>
              )}
            </Col>

            <Col md={6}>
              <Card className="bg-light">
                <Card.Body>
                  <h5>Tóm tắt đơn hàng</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tạm tính:</span>
                    <span>{order.totalAmount.toLocaleString("vi-VN")} VND</span>
                  </div>

                  {order.discountApplied > 0 && (
                    <div className="d-flex justify-content-between mb-2 text-success">
                      <span>Giảm giá:</span>
                      <span>
                        -{order.discountApplied.toLocaleString("vi-VN")} VND
                      </span>
                    </div>
                  )}

                  <div className="d-flex justify-content-between fw-bold">
                    <span>Tổng cộng:</span>
                    <span>{order.totalAmount.toLocaleString("vi-VN")} VND</span>
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
