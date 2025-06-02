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
        console.error("Lỗi khi tải đơn hàng:", error);
        setError("Không thể tải đơn hàng. Vui lòng thử lại sau.");
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
      await orderAPI.updateOrderStatus(orderId, { status: newStatus });

      // Cập nhật lại trong danh sách
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === orderId ? { ...o, status: newStatus } : o
        )
      );

      if (currentOrder && currentOrder._id === orderId) {
        setCurrentOrder({ ...currentOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn:", error);
      setError(
        error.response?.data?.message || "Không thể cập nhật trạng thái đơn"
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
    return date.toLocaleDateString("vi-VN", {
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
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="fs-4 fw-bold mb-4">Đơn hàng</h1>

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
                placeholder="Tìm theo Mã đơn hoặc Khách hàng"
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
              <option value="">Tất cả trạng thái</option>
              <option value="unverified">Chưa xác nhận</option>
              <option value="pending">Đang chờ</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="cancelled">Đã hủy</option>
            </Form.Select>
          </div>
        </div>
      </div>

      <Card>
        <div className="table-responsive">
          <Table hover className="mb-0">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Ngày</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th className="text-end">Hành động</th>
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
                    <td>
                      {order.totalAmount.toLocaleString("vi-VN")}
                      {" VND"}
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(order.status)}>
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
                      </Badge>
                    </td>
                    {/* <td className="text-end">
                      <Button
                        variant="link"
                        className="text-success p-0"
                        onClick={() => handleViewOrder(order)}
                      >
                        Xem chi tiết
                      </Button>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Không tìm thấy đơn hàng
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal Chi tiết đơn hàng */}
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
                  Đơn hàng #
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
                    <h6 className="fw-bold">Thông tin khách hàng</h6>
                    <p className="mb-1">Tên: {currentOrder.userId.name}</p>
                    <p className="mb-1">Email: {currentOrder.userId.email}</p>
                    <p className="mb-0">
                      Tên đăng nhập: {currentOrder.userId.username}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold">Thông tin đơn hàng</h6>
                    <p className="mb-1">
                      Ngày: {formatDate(currentOrder.createdAt)}
                    </p>
                    <p className="mb-1">
                      Phương thức thanh toán: {currentOrder.paymentMethod}
                    </p>
                    <p className="mb-0">
                      Trạng thái:{" "}
                      <Badge bg={getStatusBadgeVariant(currentOrder.status)}>
                        {currentOrder.status === "unverified"
                          ? "Chưa xác nhận"
                          : currentOrder.status === "pending"
                          ? "Đang chờ"
                          : currentOrder.status === "shipping"
                          ? "Đang giao"
                          : currentOrder.status === "delivered"
                          ? "Đã giao"
                          : currentOrder.status === "cancelled"
                          ? "Đã hủy"
                          : currentOrder.status}
                      </Badge>
                    </p>
                  </div>
                </div>

                <h6 className="fw-bold mb-3">Địa chỉ giao hàng</h6>
                <p className="mb-4">{currentOrder.shippingAddress}</p>

                <h6 className="fw-bold mb-3">Sản phẩm đã đặt</h6>
                <div className="table-responsive mb-4">
                  <Table bordered size="sm">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th className="text-end">Giá</th>
                        <th className="text-end">Số lượng</th>
                        <th className="text-end">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.productId.name}</td>
                          <td className="text-end">
                            {item.price.toLocaleString("vi-VN")} VND
                          </td>
                          <td className="text-end">{item.quantity}</td>
                          <td className="text-end">
                            {(item.price * item.quantity).toLocaleString(
                              "vi-VN"
                            )}{" "}
                            VND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3" className="text-end">
                          Tổng cộng:
                        </th>
                        <th className="text-end">
                          {currentOrder.totalAmount.toLocaleString("vi-VN")} VND
                        </th>
                      </tr>
                    </tfoot>
                  </Table>
                </div>

                <h6 className="fw-bold mb-3">Cập nhật trạng thái</h6>
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
                    Chưa xác nhận
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
                    Đang chờ
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
                    Đang giao
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
                    Đã giao
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
                    Đã hủy
                  </Button>
                </div>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Đóng
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
