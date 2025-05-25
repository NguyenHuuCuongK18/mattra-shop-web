"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, InputGroup, Form } from "react-bootstrap";
import { useCart } from "../../contexts/CartContext";
import Button from "../../components/ui/Button";

function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart, clearCart } =
    useCart();
  const [total, setTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (cart && Array.isArray(cart.items)) {
      const calculatedTotal = cart.items.reduce((sum, item) => {
        const price = item.productId?.price || item.price;
        return sum + price * item.quantity;
      }, 0);
      setTotal(calculatedTotal);
    }
  }, [cart]);

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    updateCartItem(productId, quantity);
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleCheckout = () => {
    navigate("/checkout");
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    // Simulate coupon validation
    if (couponCode.toUpperCase() === "WELCOME10") {
      setCouponSuccess("Coupon applied successfully! 10% discount");
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code");
      setCouponSuccess("");
    }
  };

  if (loading) {
    return (
      <Container className="py-5 fade-in">
        <h1 className="fs-2 fw-bold mb-4">Your Cart</h1>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <Container className="py-5 fade-in">
        <h1 className="fs-2 fw-bold mb-4">Your Cart</h1>
        <div className="bg-white rounded-4 shadow-sm text-center py-5">
          <i className="bi bi-cart-x fs-1 text-secondary mb-3"></i>
          <h3 className="fs-4 fw-semibold">Your cart is empty</h3>
          <p className="text-secondary mb-4">
            Start shopping to add items to your cart.
          </p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5 fade-in">
      <h1 className="fs-2 fw-bold mb-4">Your Cart</h1>

      <Row>
        <Col lg={8} className="mb-4 mb-lg-0">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-semibold mb-0">
                Shopping Cart ({cart.items.length} items)
              </h2>
            </div>
            <div className="p-0">
              {cart.items.map((item) => {
                const productId = item.productId?._id || item.product;
                const productName = item.productId?.name || item.name;
                const productPrice = item.productId?.price || item.price;
                const productImage =
                  item.productId?.image ||
                  item.image ||
                  "https://images.unsplash.com/photo-1523920290228-4f321a939b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
                const productCategory =
                  item.productId?.category || item.category;

                return (
                  <div key={productId} className="p-4 border-bottom">
                    <div className="d-flex">
                      <div className="flex-shrink-0">
                        <Link to={`/products/${productId}`}>
                          <img
                            src={productImage}
                            alt={productName}
                            className="rounded-3"
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                            }}
                          />
                        </Link>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Link
                              to={`/products/${productId}`}
                              className="text-decoration-none"
                            >
                              <h3 className="fs-5 fw-semibold mb-1">
                                {productName}
                              </h3>
                            </Link>
                            <p className="text-success mb-2">
                              ${productPrice.toFixed(2)}
                            </p>
                            {productCategory && (
                              <div className="mb-2">
                                <span className="badge bg-light text-dark">
                                  {productCategory}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-sm text-danger border-0"
                            onClick={() => handleRemoveItem(productId)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="d-flex justify-content-between align-items-end mt-2">
                          <Form.Control
                            as="select"
                            value={item.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                productId,
                                parseInt(e.target.value, 10)
                              )
                            }
                            style={{ width: "120px" }}
                          >
                            {[...Array(item.countInStock || 10).keys()].map(
                              (x) => (
                                <option key={x + 1} value={x + 1}>
                                  {x + 1}
                                </option>
                              )
                            )}
                          </Form.Control>
                          <div className="fw-semibold">
                            ${(productPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 d-flex justify-content-between">
              <Button variant="outline" onClick={handleClearCart}>
                Clear Cart
              </Button>
              <Link to="/products">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </Col>

        <Col lg={4}>
          <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-semibold mb-0">Order Summary</h2>
            </div>
            <div className="p-4">
              <div className="mb-3 d-flex justify-content-between">
                <span className="text-secondary">Subtotal</span>
                <span className="fw-semibold">${total.toFixed(2)}</span>
              </div>
              <div className="mb-3 d-flex justify-content-between">
                <span className="text-secondary">Shipping</span>
                <span>{total > 50 ? "Free" : "$5.00"}</span>
              </div>
              <div className="mb-3 d-flex justify-content-between">
                <span className="text-secondary">Tax</span>
                <span>${(total * 0.1).toFixed(2)}</span>
              </div>
              {couponSuccess && (
                <div className="mb-3 d-flex justify-content-between text-success">
                  <span>Discount (10%)</span>
                  <span>-${(total * 0.1).toFixed(2)}</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Total</span>
                <span>
                  $
                  {couponSuccess
                    ? (
                        total +
                        (total > 50 ? 0 : 5) +
                        total * 0.1 -
                        total * 0.1
                      ).toFixed(2)
                    : (total + (total > 50 ? 0 : 5) + total * 0.1).toFixed(2)}
                </span>
              </div>

              <form onSubmit={handleApplyCoupon} className="mb-4">
                <div className="mb-2">
                  <label className="form-label small">Coupon Code</label>
                  <div className="d-flex">
                    <input
                      type="text"
                      className="form-control"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                    />
                    <Button type="submit" className="ms-2">
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <div className="text-danger small mt-1">{couponError}</div>
                  )}
                  {couponSuccess && (
                    <div className="text-success small mt-1">
                      {couponSuccess}
                    </div>
                  )}
                </div>
              </form>

              <Button className="w-100 py-2" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>

              <div className="mt-3">
                <div className="d-flex align-items-center mb-2 small">
                  <i className="bi bi-shield-lock text-success me-2"></i>
                  <span>Secure checkout</span>
                </div>
                <div className="d-flex align-items-center mb-2 small">
                  <i className="bi bi-truck text-success me-2"></i>
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="d-flex align-items-center small">
                  <i className="bi bi-arrow-return-left text-success me-2"></i>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-4 shadow-sm overflow-hidden">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-semibold mb-0">We Accept</h2>
            </div>
            <div className="p-4">
              <div className="d-flex gap-2 flex-wrap">
                <div className="bg-light rounded p-2">
                  <i className="bi bi-credit-card fs-4"></i>
                </div>
                <div className="bg-light rounded p-2">
                  <i className="bi bi-paypal fs-4"></i>
                </div>
                <div className="bg-light rounded p-2">
                  <i className="bi bi-wallet2 fs-4"></i>
                </div>
                <div className="bg-light rounded p-2">
                  <i className="bi bi-bank fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default CartPage;
