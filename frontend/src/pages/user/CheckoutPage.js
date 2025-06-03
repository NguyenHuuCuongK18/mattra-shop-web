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
  const [paymentMethod, setPaymentMethod] = useState("Online Banking");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

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
  const shippingFee = 10000;
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
      if (!user?._id) return;
      setLoadingVouchers(true);
      try {
        const response = await voucherAPI.getUserVouchers();
        const availableVouchers = response.data.vouchers.filter(
          (v) =>
            v.status === "available" &&
            new Date(v.voucherId.expires_at) > new Date()
        );
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

  // Cập nhật địa chỉ khi user thay đổi
  useEffect(() => {
    if (user?.address) {
      setShippingAddress(user.address);
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

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    setSelectedVoucher(null);
    setDiscountAmount(0);

    if (!couponCode.trim()) {
      setCouponError("Vui lòng nhập mã voucher");
      return;
    }

    try {
      const response = await voucherAPI.validateVoucher(couponCode);
      const voucher = response.data.voucher;
      if (
        voucher &&
        new Date(voucher.expires_at) > new Date() &&
        !voucher.is_used
      ) {
        setSelectedVoucher(voucher);
        toast.success(`Voucher "${voucher.code}" đã áp dụng thành công`);
      } else {
        setCouponError("Mã voucher không hợp lệ hoặc đã hết hạn");
      }
    } catch (error) {
      setCouponError(
        error.response?.data?.message || "Mã voucher không hợp lệ"
      );
    }
  };

  const handleSelectVoucher = (voucherId) => {
    const voucher = vouchers.find(
      (v) => v.voucherId._id === voucherId
    )?.voucherId;
    setSelectedVoucher(voucher || null);
    setCouponCode("");
    setCouponError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    setLoading(true);
    try {
      // 1. Tạo đơn hàng
      const orderData = {
        paymentMethod: "Online Banking",
        shippingAddress,
        selectedItems: cart.items.map((item) => ({
          productId: item.productId._id || item.productId.id,
          quantity: item.quantity,
        })),
      };
      const orderResponse = await orderAPI.createOrder(orderData);
      const order = orderResponse.data.order;

      // 2. Áp dụng voucher nếu có (nếu lỗi thì im lặng)
      if (selectedVoucher) {
        try {
          await orderAPI.applyVoucher(order._id, selectedVoucher._id);
        } catch (err) {
          console.error("Áp dụng voucher thất bại:", err);
        }
      }

      // 3. Tạo VietQR để thanh toán
      const paymentResponse = await paymentAPI.generateVietQR({
        orderId: order._id,
      });
      const { paymentId, paymentImgUrl, expiresAt } = paymentResponse.data;

      // 4. Lưu thông tin thanh toán vào localStorage
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

      // 5. Xóa giỏ hàng
      await clearCart();

      // 6. Chuyển hướng ngay đến trang thanh toán
      navigate(`/payment?paymentId=${paymentId}&orderId=${order._id}`);
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
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
              {/* <-- Thông báo bổ sung --> */}
              <Alert variant="warning" className="mb-4">
                <i className="bi bi-exclamation-circle me-2"></i>
                <strong>
                  Các sản phẩm đồ uống hiện chỉ hỗ trợ ship ở khu vực Hòa Lạc
                </strong>
              </Alert>
              {/* <-- Kết thúc thông báo --> */}

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

                <Form.Group className="mb-4">
                  <Form.Label>Mã voucher</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="text"
                        placeholder="Nhập mã voucher"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        isInvalid={!!couponError}
                      />
                      <Form.Control.Feedback type="invalid">
                        {couponError}
                      </Form.Control.Feedback>
                    </Col>
                    <Col xs="auto">
                      <BootstrapButton
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim()}
                      >
                        Áp dụng
                      </BootstrapButton>
                    </Col>
                  </Row>
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
                  disabled={loading || !shippingAddress.trim()}
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
