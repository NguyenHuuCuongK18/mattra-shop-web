"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { orderAPI, voucherAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const [shippingAddress, setShippingAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  // Calculate totals
  const subtotal = getCartTotal();
  const shippingFee = subtotal > 50 ? 0 : 5; // Free shipping over $50
  const total = subtotal + shippingFee - discountAmount;

  useEffect(() => {
    // Redirect if cart is empty
    if (!cart.items || cart.items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    // Fetch user vouchers
    const fetchVouchers = async () => {
      if (!user) return;

      setLoadingVouchers(true);
      try {
        const response = await voucherAPI.getUserVouchers();
        // Filter only available vouchers
        const availableVouchers = response.data.vouchers.filter(
          (v) => v.status === "available"
        );
        setVouchers(availableVouchers);
      } catch (error) {
        console.error("Error fetching vouchers:", error);
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

  // Calculate discount when voucher is selected
  useEffect(() => {
    if (!selectedVoucher) {
      setDiscountAmount(0);
      return;
    }

    const voucher = vouchers.find((v) => v.voucherId.id === selectedVoucher);
    if (voucher) {
      const voucherDetails = voucher.voucherId;
      const discountPercentage = voucherDetails.discount_percentage / 100;
      const calculatedDiscount = subtotal * discountPercentage;

      // Apply max discount cap if specified
      const finalDiscount =
        voucherDetails.max_discount > 0
          ? Math.min(calculatedDiscount, voucherDetails.max_discount)
          : calculatedDiscount;

      setDiscountAmount(finalDiscount);
    }
  }, [selectedVoucher, vouchers, subtotal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      toast.error("Please enter a shipping address");
      return;
    }

    setLoading(true);
    try {
      // Prepare order data
      const orderData = {
        paymentMethod,
        shippingAddress,
        selectedItems: cart.items.map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
        })),
      };

      // Add voucher if selected
      if (selectedVoucher) {
        orderData.voucherId = selectedVoucher;
      }

      // Create order
      const response = await orderAPI.createOrder(orderData);

      // Clear cart after successful order
      await clearCart();

      toast.success("Order placed successfully!");

      // Navigate to order confirmation page
      navigate(`/orders/${response.data.order.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to place order";
      toast.error(errorMessage);
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
            <Button variant="primary" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
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
                  <Form.Label>Payment Method</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      id="cod"
                      label="Cash on Delivery"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === "Cash on Delivery"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mb-2"
                    />
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

                {vouchers.length > 0 && (
                  <Form.Group className="mb-4">
                    <Form.Label>Apply Voucher</Form.Label>
                    <Form.Select
                      value={selectedVoucher}
                      onChange={(e) => setSelectedVoucher(e.target.value)}
                      disabled={loadingVouchers}
                    >
                      <option value="">No voucher</option>
                      {vouchers.map((voucher) => (
                        <option
                          key={voucher.voucherId.id}
                          value={voucher.voucherId.id}
                        >
                          {voucher.voucherId.discount_percentage}% off
                          {voucher.voucherId.max_discount > 0
                            ? ` (max $${voucher.voucherId.max_discount})`
                            : ""}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                <Button
                  variant="primary"
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
                <ListGroup.Item key={item.productId._id}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-0 fw-bold">{item.productId.name}</p>
                      <small className="text-muted">
                        ${item.productId.price.toFixed(2)} x {item.quantity}
                      </small>
                    </div>
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
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}
                  </span>
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

              <ListGroup.Item>
                <div className="d-flex justify-content-between fw-bold">
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
