"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, InputGroup, Form } from "react-bootstrap";
import { useCart } from "../../contexts/CartContext";
import Button from "../../components/ui/Button";
import { voucherAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart, clearCart } =
    useCart();
  const [total, setTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
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
    if (voucherApplied && selectedVoucher) {
      navigate("/checkout", { state: { voucher: selectedVoucher } });
    } else {
      navigate("/checkout");
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    setVoucherApplied(false);
    setSelectedVoucher(null);

    if (!couponCode) {
      setCouponError("Vui lòng nhập mã voucher");
      return;
    }

    try {
      const { data } = await voucherAPI.validateVoucher(couponCode);
      const { discount_percentage, max_discount, code, _id } = data.voucher;
      setDiscountPercentage(discount_percentage);
      setMaxDiscount(max_discount || Infinity);
      setSelectedVoucher({ _id, code, discount_percentage, max_discount });
      setVoucherApplied(true);
      setCouponSuccess(
        `Voucher "${code}" đã áp dụng: Giảm ${discount_percentage}%${
          max_discount
            ? ` (tối đa ${max_discount.toLocaleString("vi-VN")} VND)`
            : ""
        }`
      );
    } catch (err) {
      setCouponError(err.response?.data?.message || "Mã voucher không hợp lệ");
      setDiscountPercentage(0);
      setMaxDiscount(0);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 fade-in">
        <h1 className="fs-2 fw-bold mb-4">Giỏ hàng của bạn</h1>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <Container className="py-5 fade-in">
        <h1 className="fs-2 fw-bold mb-4">Giỏ hàng của bạn</h1>
        <div className="bg-white rounded-4 shadow-sm text-center py-5">
          <i className="bi bi-cart-x fs-1 text-secondary mb-3"></i>
          <h3 className="fs-4 fw-semibold">Giỏ hàng trống</h3>
          <p className="text-secondary mb-4">
            Hãy bắt đầu mua sắm để thêm sản phẩm vào giỏ hàng.
          </p>
          <Link to="/products">
            <Button>Xem sản phẩm</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const discountAmount = voucherApplied
    ? Math.min((total * discountPercentage) / 100, maxDiscount)
    : 0;

  return (
    <Container className="py-5 fade-in">
      <h1 className="fs-2 fw-bold mb-4">Giỏ hàng của bạn</h1>

      <Row>
        {/* Danh sách sản phẩm trong giỏ */}
        <Col lg={8} className="mb-4 mb-lg-0">
          <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-semibold mb-0">
                Giỏ hàng ({cart.items.length} sản phẩm)
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
                              {productPrice.toLocaleString("vi-VN")} VND
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
                            {(productPrice * item.quantity).toLocaleString(
                              "vi-VN"
                            )}
                            {" VND"}
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
                Xóa giỏ hàng
              </Button>
              <Link to="/products">
                <Button variant="outline">Tiếp tục mua sắm</Button>
              </Link>
            </div>
          </div>
        </Col>

        {/* Thanh tính */}
        <Col lg={4}>
          <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-semibold mb-0">Tóm tắt đơn hàng</h2>
            </div>
            <div className="p-4">
              <div className="mb-3 d-flex justify-content-between">
                <span className="text-secondary">Tạm tính</span>
                <span className="fw-semibold">
                  {total.toLocaleString("vi-VN")} VND
                </span>
              </div>
              <div className="mb-3 d-flex justify-content-between">
                <span className="text-secondary">Phí vận chuyển</span>
                <span>
                  {total > 10000
                    ? "Miễn phí"
                    : `${(10000).toLocaleString("vi-VN")} VND`}
                </span>
              </div>
              {voucherApplied && (
                <div className="mb-3 d-flex justify-content-between text-success">
                  <span>Giảm giá ({discountPercentage}%)</span>
                  <span>-{discountAmount.toLocaleString("vi-VN")} VND</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Tổng cộng</span>
                <span>
                  {(
                    total +
                    (total > 10000 ? 0 : 10000) -
                    discountAmount
                  ).toLocaleString("vi-VN")}{" "}
                  VND
                </span>
              </div>

              <form onSubmit={handleApplyCoupon} className="mb-4">
                <div className="mb-2">
                  <label className="form-label small">Mã voucher</label>
                  <div className="d-flex">
                    <input
                      type="text"
                      className="form-control"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Nhập mã voucher"
                    />
                    <Button type="submit" className="ms-2">
                      Áp dụng
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
                Tiến hành thanh toán
              </Button>

              <div className="mt-3">
                <div className="d-flex align-items-center mb-2 small">
                  <i className="bi bi-shield-lock text-success me-2"></i>
                  <span>Thanh toán an toàn</span>
                </div>
                <div className="d-flex align-items-center mb-2 small">
                  <i className="bi bi-truck text-success me-2"></i>
                  <span>Phí vận chuyển chỉ 10.000 VND</span>
                </div>
                {/* <div className="d-flex align-items-center small">
                  <i className="bi bi-arrow-return-left text-success me-2"></i>
                  <span>Chính sách hoàn trả trong 30 ngày</span>
                </div> */}
              </div>
            </div>
          </div>

          {/* <div className="bg-white rounded-4 shadow-sm overflow-hidden">
            <div className="p-4 border-bottom">
              <h2 className="fs-5 fw-semibold mb-0">Chúng tôi chấp nhận</h2>
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
          </div> */}
        </Col>
      </Row>
    </Container>
  );
}

export default CartPage;
