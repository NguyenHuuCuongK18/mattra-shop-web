// src/pages/ProductDetailPage.js
"use client";

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Breadcrumb,
  Badge,
  InputGroup,
  Form,
  Alert,
  Tab,
  Tabs,
} from "react-bootstrap";
import { productAPI, reviewAPI } from "../utils/api";
import Button from "../components/ui/Button";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";

const reviewStyles = `
  .rating-stars i {
    transition: transform 0.2s ease;
  }
  .rating-stars i:hover {
    transform: scale(1.1);
  }
  .review-item {
    transition: box-shadow 0.2s ease;
  }
  .review-item:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [addedToCart, setAddedToCart] = useState(false);

  // Form state cho review
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productAPI.getProductById(id);
        // Chuẩn hóa product: đổi _id thành id
        const normalizedProduct = {
          ...response.data.product,
          id: response.data.product._id,
        };
        setProduct(normalizedProduct);

        // Lấy thêm phần đánh giá
        await fetchReviews();
      } catch (err) {
        console.error(
          "Lỗi khi tải thông tin sản phẩm:",
          err.response?.data || err.message
        );
        setError("Không thể tải sản phẩm. Vui lòng thử lại sau.");
        toast.error("Không thể tải chi tiết sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    setQuantity(1);
    setAddedToCart(false);
  }, [id]);

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getReviewsByProduct(id);
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
      // Chỉ ghi log, không báo lỗi cho user
    }
  };

  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
      setAddedToCart(true);
      toast.success(`${product.name} đã được thêm vào giỏ hàng`);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      console.error(
        "Lỗi khi thêm vào giỏ hàng:",
        err.response?.data || err.message
      );
      toast.error("Thêm vào giỏ hàng thất bại");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vui lòng đăng nhập để viết đánh giá");
      return;
    }
    setReviewLoading(true);
    try {
      await reviewAPI.createReview({
        productId: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Gửi đánh giá thành công");
      setReviewForm({ rating: 5, comment: "" });
      await fetchReviews(); // Làm mới danh sách đánh giá
    } catch (err) {
      console.error("Lỗi khi gửi đánh giá:", err);
      toast.error(err.response?.data?.message || "Gửi đánh giá thất bại");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 fade-in">
        <div className="placeholder-glow">
          <div className="placeholder col-4 mb-3"></div>
          <Row>
            <Col md={6}>
              <div
                className="placeholder col-12 rounded"
                style={{ height: "400px" }}
              ></div>
            </Col>
            <Col md={6}>
              <div className="placeholder col-8 mb-3"></div>
              <div className="placeholder col-4 mb-3"></div>
              <div className="placeholder col-6 mb-3"></div>
              <div
                className="placeholder col-12 mb-3"
                style={{ height: "100px" }}
              ></div>
              <div className="placeholder col-4 mb-3"></div>
              <div className="placeholder col-12 mb-3"></div>
            </Col>
          </Row>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 fade-in">
        <Alert variant="danger">
          <Alert.Heading>Lỗi</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link to="/products">
              <Button variant="outline">Quay về Sản Phẩm</Button>
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5 fade-in">
        <div className="text-center py-5">
          <i className="bi bi-exclamation-circle fs-1 text-secondary mb-3"></i>
          <h2 className="fs-4 fw-semibold">Không tìm thấy sản phẩm</h2>
          <p className="text-secondary mb-4">
            Sản phẩm bạn tìm không tồn tại hoặc đã bị xóa.
          </p>
          <Link to="/products">
            <Button>Xem Sản Phẩm</Button>
          </Link>
        </div>
      </Container>
    );
  }

  // Tính điểm trung bình
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <>
      <style>{reviewStyles}</style>
      <Container className="py-5 fade-in">
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
            Trang Chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/products" }}>
            Sản Phẩm
          </Breadcrumb.Item>
          <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
        </Breadcrumb>

        {addedToCart && (
          <Alert
            variant="success"
            className="d-flex align-items-center mb-4 fade-in"
          >
            <i className="bi bi-check-circle-fill me-2"></i>
            <div>
              <strong>{product.name}</strong> đã được thêm vào giỏ hàng.{" "}
              <Link to="/cart" className="alert-link">
                Xem Giỏ Hàng
              </Link>
            </div>
          </Alert>
        )}

        <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-5">
          <Row className="g-0">
            <Col lg={6}>
              <div
                className="position-relative h-100"
                style={{ minHeight: "400px" }}
              >
                <img
                  src={
                    product.image ||
                    "/placeholder.svg?height=400&width=600" ||
                    "/placeholder.svg"
                  }
                  alt={product.name}
                  className="w-100 h-100 object-fit-cover"
                />
                {product.isFeatured && (
                  <Badge
                    bg="warning"
                    className="position-absolute top-0 start-0 m-3 px-3 py-2"
                  >
                    <i className="bi bi-star-fill me-1"></i>
                    Nổi Bật
                  </Badge>
                )}
                {product.stock <= 0 && (
                  <div className="position-absolute top-0 end-0 bg-danger text-white px-3 py-2 m-3 rounded-pill">
                    Hết Hàng
                  </div>
                )}
              </div>
            </Col>
            <Col lg={6}>
              <div className="p-4 p-lg-5">
                <h1 className="fs-2 fw-bold mb-2">{product.name}</h1>
                <div className="d-flex align-items-center mb-3">
                  <h2 className="fs-3 fw-bold text-success mb-0 me-3">
                    {product.price.toLocaleString("vi-VN")} VND
                  </h2>
                  {reviews.length > 0 && (
                    <div className="d-flex align-items-center">
                      <div className="text-warning me-2">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star${
                              i < Math.round(averageRating) ? "-fill" : ""
                            }`}
                          ></i>
                        ))}
                      </div>
                      <small className="text-muted">
                        ({reviews.length} đánh giá)
                      </small>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-secondary">{product.description}</p>
                </div>

                {product.categories?.name && (
                  <div className="mb-4">
                    <span className="badge bg-light text-dark px-3 py-2 rounded-pill">
                      {product.categories.name}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <Badge
                    bg={product.stock > 0 ? "success" : "danger"}
                    className="py-2 px-3"
                  >
                    {product.stock > 0
                      ? `Còn Hàng (${product.stock} sản phẩm)`
                      : "Hết Hàng"}
                  </Badge>
                </div>

                {product.stock > 0 && (
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <InputGroup style={{ width: "140px" }}>
                        <Button
                          variant="outline"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <Form.Control
                          type="number"
                          value={quantity}
                          readOnly
                          className="text-center"
                        />
                        <Button
                          variant="outline"
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= product.stock}
                        >
                          +
                        </Button>
                      </InputGroup>
                    </div>

                    <Button onClick={handleAddToCart} className="w-100 py-2">
                      <i className="bi bi-cart-plus me-2"></i>
                      Thêm vào Giỏ hàng
                    </Button>
                  </div>
                )}

                <div className="mt-4">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-truck text-success me-2"></i>
                    <span>Miễn phí giao hàng cho đơn hàng trên 50.000 VND</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-arrow-repeat text-success me-2"></i>
                    <span>Chính sách đổi trả trong 30 ngày</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-shield-check text-success me-2"></i>
                    <span>Thanh toán an toàn</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Tabs defaultActiveKey="reviews" className="mb-4">
          <Tab eventKey="reviews" title={`Đánh Giá (${reviews.length})`}>
            <div className="bg-white p-4 rounded-bottom shadow-sm">
              {/* Form Viết Đánh Giá */}
              {user ? (
                <div className="mb-5">
                  <h4 className="mb-3">Viết Đánh Giá</h4>
                  <Form onSubmit={handleReviewSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Đánh giá</Form.Label>
                          <div className="d-flex align-items-center">
                            <div className="rating-stars me-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                  key={star}
                                  className={`bi bi-star${
                                    star <= reviewForm.rating ? "-fill" : ""
                                  } fs-4 text-warning me-1`}
                                  style={{ cursor: "pointer" }}
                                  onClick={() =>
                                    setReviewForm({
                                      ...reviewForm,
                                      rating: star,
                                    })
                                  }
                                  onMouseEnter={(e) =>
                                    (e.target.style.transform = "scale(1.1)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.target.style.transform = "scale(1)")
                                  }
                                />
                              ))}
                            </div>
                            <span className="text-muted">
                              {reviewForm.rating === 1 && "Kém"}
                              {reviewForm.rating === 2 && "Tạm ổn"}
                              {reviewForm.rating === 3 && "Tốt"}
                              {reviewForm.rating === 4 && "Rất tốt"}
                              {reviewForm.rating === 5 && "Xuất sắc"}
                            </span>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Bình luận</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={reviewForm.comment}
                        onChange={(e) =>
                          setReviewForm({
                            ...reviewForm,
                            comment: e.target.value,
                          })
                        }
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                        required
                      />
                    </Form.Group>
                    <Button type="submit" disabled={reviewLoading}>
                      {reviewLoading ? "Đang gửi..." : "Gửi Đánh Giá"}
                    </Button>
                  </Form>
                  <hr className="my-4" />
                </div>
              ) : (
                <div className="text-center mb-4 p-4 bg-light rounded">
                  <p className="mb-2">Vui lòng đăng nhập để viết đánh giá</p>
                  <Link to="/login">
                    <Button variant="outline">Đăng nhập</Button>
                  </Link>
                </div>
              )}

              {/* Danh sách Đánh Giá */}
              {reviews.length > 0 ? (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">Đánh Giá Khách Hàng</h4>
                    {reviews.length > 0 && (
                      <div className="d-flex align-items-center">
                        <div className="text-warning me-2">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`bi bi-star${
                                i < Math.round(averageRating) ? "-fill" : ""
                              }`}
                            ></i>
                          ))}
                        </div>
                        <span className="fw-medium">
                          {averageRating.toFixed(1)}
                        </span>
                        <span className="text-muted ms-1">
                          ({reviews.length} đánh giá)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="reviews-container">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="review-item border rounded p-4 mb-3 bg-light"
                      >
                        <div className="d-flex align-items-start mb-3">
                          <div className="flex-shrink-0 me-3">
                            {review.userId?.avatar ? (
                              <img
                                src={review.userId.avatar || "/placeholder.svg"}
                                alt={review.userId?.name || "User"}
                                className="rounded-circle"
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{ width: "50px", height: "50px" }}
                              >
                                {(
                                  review.userId?.name ||
                                  review.userId?.username ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1 fw-semibold">
                                  {review.userId?.name ||
                                    review.userId?.username ||
                                    "Ẩn danh"}
                                </h6>
                                <div className="d-flex align-items-center mb-1">
                                  <div className="text-warning me-2">
                                    {[...Array(5)].map((_, i) => (
                                      <i
                                        key={i}
                                        className={`bi bi-star${
                                          i < review.rating ? "-fill" : ""
                                        }`}
                                      ></i>
                                    ))}
                                  </div>
                                  <span className="small text-muted">
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString("vi-VN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="mb-0 text-dark">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 bg-light rounded">
                  <i className="bi bi-star fs-1 text-secondary mb-3"></i>
                  <h5 className="fw-semibold">Chưa có đánh giá nào</h5>
                  <p className="text-secondary mb-4">
                    Hãy là người đầu tiên đánh giá sản phẩm này
                  </p>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </Container>
    </>
  );
}

export default ProductDetailPage;
