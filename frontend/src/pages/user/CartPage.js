"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import { voucherAPI } from "../../utils/api";
import { toast } from "react-hot-toast";

function CartPage() {
  const { cart, loading, updateCartItem, removeFromCart, clearCart } =
    useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [total, setTotal] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Định nghĩa phí vận chuyển (hài hòa với CheckoutPage.js)
  const shippingFee = 30000;

  useEffect(() => {
    // Tính tổng tiền giỏ hàng
    if (cart && Array.isArray(cart.items)) {
      const calculatedTotal = cart.items.reduce((sum, item) => {
        const price = item.productId?.price || item.price;
        return sum + price * item.quantity;
      }, 0);
      setTotal(calculatedTotal);
    }
  }, [cart]);

  useEffect(() => {
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
  }, [user]);

  useEffect(() => {
    // Tính toán giảm giá dựa trên voucher
    if (selectedVoucher) {
      const discountPercentage = selectedVoucher.discount_percentage / 100;
      const calculatedDiscount = total * discountPercentage;
      const finalDiscount =
        selectedVoucher.max_discount > 0
          ? Math.min(calculatedDiscount, selectedVoucher.max_discount)
          : calculatedDiscount;
      setDiscountAmount(finalDiscount);
    } else {
      setDiscountAmount(0);
    }
  }, [selectedVoucher, total]);

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
    if (selectedVoucher) {
      navigate("/checkout", { state: { voucher: selectedVoucher } });
    } else {
      navigate("/checkout");
    }
  };

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
                <span>{shippingFee.toLocaleString("vi-VN")} VND</span>
              </div>
              {discountAmount > 0 && (
                <div className="mb-3 d-flex justify-content-between text-success">
                  <span>
                    Giảm giá ({selectedVoucher?.discount_percentage || 0}
                    %)
                  </span>
                  <span>-{discountAmount.toLocaleString("vi-VN")} VND</span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Tổng cộng</span>
                <span>
                  {(total + shippingFee - discountAmount).toLocaleString(
                    "vi-VN"
                  )}{" "}
                  VND
                </span>
              </div>

              <div className="mb-4">
                <label className="form-label small">Chọn mã voucher</label>
                {loadingVouchers ? (
                  <div className="d-flex align-items-center">
                    <div
                      className="spinner-border spinner-border-sm text-success"
                      role="status"
                    >
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <span className="ms-2">Đang tải voucher...</span>
                  </div>
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
                          {voucher.voucherId.discount_percentage}% giảm, tối đa{" "}
                          {(voucher.voucherId.max_discount || 0).toLocaleString(
                            "vi-VN"
                          )}{" "}
                          VND
                        </option>
                      ))
                    ) : (
                      <option disabled>Không có voucher khả dụng</option>
                    )}
                  </Form.Select>
                )}
              </div>

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
                  <span>Phí vận chuyển 20.000 VND</span>
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
