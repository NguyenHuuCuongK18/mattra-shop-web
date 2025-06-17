"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button as BootstrapButton,
  Card,
  ListGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { orderAPI, voucherAPI, paymentAPI } from "../../utils/api";
import Button from "../../components/ui/Button";
import { toast } from "react-hot-toast";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(
    state?.voucher || null
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingAddress, setShippingAddress] = useState(user?.address || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Online Banking");

  // Định nghĩa phí vận chuyển
  const shippingFee = 20000;

  // Tính subtotal
  const calculateSubtotal = () => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce(
      (total, item) =>
        total + (item.productId?.price || 0) * (item.quantity || 0),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const total = subtotal + shippingFee - discountAmount;

  useEffect(() => {
    // Nếu giỏ trống, chuyển về Cart
    if (!cart?.items?.length) {
      toast.error("Giỏ hàng trống");
      navigate("/cart");
      return;
    }

    // Lấy voucher của user
    const fetchVouchers = async () => {
      if (!user) return;
      setLoadingVouchers(true);
      try {
        const response = await voucherAPI.getUserVouchers();
        console.log("Raw vouchers:", response.data.vouchers); // Debug
        const availableVouchers = response.data.vouchers.filter((v) => {
          if (!v.voucherId || !v.voucherId.expires_at) return false;
          const expiresAt = new Date(v.voucherId.expires_at);
          const now = new Date();
          const isValid = v.status === "available" && expiresAt >= now;
          console.log(
            `Voucher ${v.voucherId.code}: status=${v.status}, expires_at=${expiresAt}, now=${now}, valid=${isValid}`
          ); // Debug
          return isValid;
        });
        setVouchers(availableVouchers);
      } catch (error) {
        console.error("Lỗi khi tải voucher:", error);
        toast.error(error.response?.data?.message || "Không thể tải voucher");
      } finally {
        setLoadingVouchers(false);
      }
    };

    fetchVouchers();
  }, [user, cart, navigate]);

  // Cập nhật địa chỉ và số điện thoại khi user thay đổi
  useEffect(() => {
    if (user?.address) {
      setShippingAddress(user.address);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  // Tính toán giảm giá dựa trên voucher
  useEffect(() => {
    if (selectedVoucher) {
      const discountPercentage = selectedVoucher.discount_percentage / 100;
      const calculatedDiscount = subtotal * discountPercentage;
      const finalDiscount =
        selectedVoucher.max_discount > 0
          ? Math.min(calculatedDiscount, selectedVoucher.max_discount)
          : calculatedDiscount;
      setDiscountAmount(finalDiscount);
    } else {
      setDiscountAmount(0);
    }
  }, [selectedVoucher, subtotal]);

  // Xử lý chọn voucher từ dropdown
  const handleSelectVoucher = (e) => {
    const voucherId = e.target.value;
    if (voucherId === "") {
      setSelectedVoucher(null);
      setDiscountAmount(0);
    } else {
      const selected = vouchers.find(
        (v) => v.voucherId._id === voucherId
      )?.voucherId;
      setSelectedVoucher(selected || null);
      if (selected) {
        toast.success(`Đã áp dụng voucher "${selected.code}"`);
      }
    }
  };

  const validatePhone = () => {
    if (!phone.trim()) {
      setPhoneError("Số điện thoại là bắt buộc");
      return false;
    }
    if (!/^\d{10,11}$/.test(phone)) {
      setPhoneError("Số điện thoại không hợp lệ (10-11 chữ số)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    if (!validatePhone()) {
      return;
    }

    setLoading(true);
    try {
      // Tạo đơn hàng với voucherId nếu có
      const orderData = {
        paymentMethod: "Online Banking",
        shippingAddress,
        phone,
        shippingFee,
        selectedItems: cart.items.map((item) => ({
          productId: item.productId._id || item.productId.id,
          quantity: item.quantity,
        })),
        voucherId: selectedVoucher?._id || null,
      };
      const orderResponse = await orderAPI.createOrder(orderData);
      const order = orderResponse.data.order;

      // Tạo VietQR để thanh toán
      const paymentResponse = await paymentAPI.generateVietQR({
        orderId: order._id,
      });
      const { paymentId, paymentImgUrl, expiresAt } = paymentResponse.data;

      // Lưu thông tin thanh toán vào localStorage
      localStorage.setItem(
        "currentPayment",
        JSON.stringify({
          paymentId,
          paymentImgUrl,
          expiresAt,
          orderId: order._id,
          amount: total,
        })
      );

      // Xóa giỏ hàng
      await clearCart();

      // Chuyển hướng ngay đến trang thanh toán
      navigate(`/payment?paymentId=${paymentId}&orderId=${order._id}`);
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      toast.error(error.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <Card.Title>Vui lòng đăng nhập</Card.Title>
            <Card.Text>Bạn cần đăng nhập để thanh toán.</Card.Text>
            <BootstrapButton
              variant="primary"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </BootstrapButton>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Thanh toán</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Thông tin giao hàng</h5>
            </Card.Header>
            <Card.Body>
              {/* Thông báo bổ sung */}
              <Alert variant="warning" className="mb-4">
                <i className="bi bi-exclamation-circle me-2"></i>
                <strong>
                  Các sản phẩm đồ uống hiện chỉ hỗ trợ ship ở khu vực Hòa Lạc
                </strong>
              </Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ giao hàng</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Nhập địa chỉ giao hàng đầy đủ"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError("");
                    }}
                    placeholder="Nhập số điện thoại (10-11 chữ số)"
                    isInvalid={!!phoneError}
                    required
                  />
                  <Form.Text className="text-muted">
                    Mặc định: {user?.phone || "Chưa có số điện thoại"}
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {phoneError}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Chọn mã voucher</Form.Label>
                  {loadingVouchers ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Form.Select
                      value={selectedVoucher?._id || ""}
                      onChange={handleSelectVoucher}
                    >
                      <option value="">Không sử dụng voucher</option>
                      {vouchers.length > 0 ? (
                        vouchers.map((voucher) => (
                          <option
                            key={voucher.voucherId._id}
                            value={voucher.voucherId._id}
                          >
                            {voucher.voucherId.code} -{" "}
                            {voucher.voucherId.discount_percentage}% giảm, tối
                            đa{" "}
                            {(
                              voucher.voucherId.max_discount || 0
                            ).toLocaleString("vi-VN")}{" "}
                            VND
                          </option>
                        ))
                      ) : (
                        <option disabled>Không có voucher khả dụng</option>
                      )}
                    </Form.Select>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Phương thức thanh toán</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      id="online"
                      label="Online Banking"
                      name="paymentMethod"
                      value="Online Banking"
                      checked={paymentMethod === "Online Banking"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  disabled={loading || !shippingAddress.trim() || !!phoneError}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">Đang xử lý...</span>
                    </>
                  ) : (
                    `Đặt hàng - ${total.toLocaleString("vi-VN")} VND`
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Bảng tóm tắt */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Tóm tắt đơn hàng</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.items.map((item) => (
                <ListGroup.Item key={item.productId._id || item.productId.id}>
                  <div className="d-flex justify-content-between">
                    <span>
                      {item.productId.name} x {item.quantity}
                    </span>
                    <span>
                      {(item.productId.price * item.quantity).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      VND
                    </span>
                  </div>
                </ListGroup.Item>
              ))}
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString("vi-VN")} VND</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee.toLocaleString("vi-VN")} VND</span>
                </div>
              </ListGroup.Item>
              {discountAmount > 0 && (
                <ListGroup.Item>
                  <div className="d-flex justify-content-between text-success">
                    <span>Giảm giá</span>
                    <span>-{discountAmount.toLocaleString("vi-VN")} VND</span>
                  </div>
                </ListGroup.Item>
              )}
              <ListGroup.Item className="fw-bold">
                <div className="d-flex justify-content-between">
                  <span>Tổng cộng</span>
                  <span>{total.toLocaleString("vi-VN")} VND</span>
                </div>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
