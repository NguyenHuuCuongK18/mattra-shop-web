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

  // Calculate subtotal
  const calculateSubtotal = () => {
    if (!cart?.items?.length) return 0;
    return cart.items.reduce(
      (total, item) =>
        total + (item.productId?.price || 0) * (item.quantity || 0),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const shippingFee = subtotal > 50 ? 0 : 5;
  const total = subtotal + shippingFee - discountAmount;

  useEffect(() => {
    // Redirect if cart is empty
    if (!cart?.items?.length) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    // Fetch user vouchers
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
        console.error("Error fetching vouchers:", error);
        toast.error(error.response?.data?.message || "Failed to load vouchers");
      } finally {
        setLoadingVouchers(false);
      }
    };

    fetchVouchers();
  }, [user, cart, navigate]);

  // Update shipping address when user changes
  useEffect(() => {
    if (user?.address) {
      setShippingAddress(user.address);
    }
  }, [user]);

  // Calculate discount from passed voucher
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
      setCouponError("Please enter a voucher code");
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
        toast.success(`Voucher "${voucher.code}" applied successfully`);
      } else {
        setCouponError("Invalid or expired voucher code");
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || "Invalid voucher code");
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
      toast.error("Please enter a shipping address");
      return;
    }

    setLoading(true);
    try {
      // 1. Create the order
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

      // 2. Apply voucher (silent failure)
      if (selectedVoucher) {
        try {
          await orderAPI.applyVoucher(order._id, selectedVoucher._id);
        } catch (err) {
          console.error("Voucher apply failed:", err);
        }
      }

      // 3. Generate the VietQR payment
      const paymentResponse = await paymentAPI.generateVietQR({
        orderId: order._id,
      });
      const { paymentId, paymentImgUrl, expiresAt } = paymentResponse.data;

      // 4. Store payment info locally
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

      // 5. Clear the cart
      await clearCart();

      // 6. Redirect immediately to payment page
      navigate(`/payment?paymentId=${paymentId}&orderId=${order._id}`);
    } catch (error) {
      console.error("Error during checkout:", error);
      // No intermediate error toasts per UX requirement
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <Card.Body>
            <Card.Title>Please Login</Card.Title>
            <Card.Text>You need to be logged in to checkout.</Card.Text>
            <BootstrapButton
              variant="primary"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </BootstrapButton>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4">Checkout</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Shipping Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Shipping Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your full shipping address"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Coupon Code</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="text"
                        placeholder="Enter coupon code"
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
                        Apply
                      </BootstrapButton>
                    </Col>
                  </Row>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Payment Method</Form.Label>
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
                      <span className="ms-2">Processing...</span>
                    </>
                  ) : (
                    `Place Order - $${total.toFixed(2)}`
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.items.map((item) => (
                <ListGroup.Item key={item.productId._id || item.productId.id}>
                  <div className="d-flex justify-content-between">
                    <span>
                      {item.productId.name} x {item.quantity}
                    </span>
                    <span>
                      ${(item.productId.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </ListGroup.Item>
              ))}
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-flex justify-content-between">
                  <span>Shipping Fee</span>
                  <span>${shippingFee.toFixed(2)}</span>
                </div>
              </ListGroup.Item>
              {discountAmount > 0 && (
                <ListGroup.Item>
                  <div className="d-flex justify-content-between text-success">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                </ListGroup.Item>
              )}
              <ListGroup.Item className="fw-bold">
                <div className="d-flex justify-content-between">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
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
