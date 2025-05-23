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

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productAPI.getProductById(id);
        console.log("Product response:", response.data);
        // Normalize product: rename _id to id
        const normalizedProduct = {
          ...response.data.product,
          id: response.data.product._id,
        };
        setProduct(normalizedProduct);

        // Fetch reviews for this product
        await fetchReviews();
      } catch (error) {
        console.error(
          "Error fetching product:",
          error.response?.data || error.message
        );
        setError("Failed to load product. Please try again later.");
        toast.error("Failed to load product details");
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
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Don't show error for reviews, just log it
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
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (error) {
      console.error(
        "Error adding to cart:",
        error.response?.data || error.message
      );
      toast.error("Failed to add to cart");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to write a review");
      return;
    }

    setReviewLoading(true);
    try {
      await reviewAPI.createReview({
        productId: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success("Review submitted successfully");
      setReviewForm({ rating: 5, comment: "" });
      await fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
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
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Link to="/products">
              <Button variant="outline">Back to Products</Button>
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
          <h2 className="fs-4 fw-semibold">Product not found</h2>
          <p className="text-secondary mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </Container>
    );
  }

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
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/products" }}>
            Products
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
              <strong>{product.name}</strong> has been added to your cart.{" "}
              <Link to="/cart" className="alert-link">
                View Cart
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
                    Featured Product
                  </Badge>
                )}
                {product.stock <= 0 && (
                  <div className="position-absolute top-0 end-0 bg-danger text-white px-3 py-2 m-3 rounded-pill">
                    Out of Stock
                  </div>
                )}
              </div>
            </Col>
            <Col lg={6}>
              <div className="p-4 p-lg-5">
                <h1 className="fs-2 fw-bold mb-2">{product.name}</h1>
                <div className="d-flex align-items-center mb-3">
                  <h2 className="fs-3 fw-bold text-success mb-0 me-3">
                    ${product.price.toFixed(2)}
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
                        ({reviews.length} review
                        {reviews.length !== 1 ? "s" : ""})
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
                      ? `In Stock (${product.stock} available)`
                      : "Out of Stock"}
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
                      Add to Cart
                    </Button>
                  </div>
                )}

                <div className="mt-4">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-truck text-success me-2"></i>
                    <span>Free shipping on orders over $50</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-arrow-repeat text-success me-2"></i>
                    <span>30-day return policy</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-shield-check text-success me-2"></i>
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <Tabs defaultActiveKey="reviews" className="mb-4">
          <Tab eventKey="reviews" title={`Reviews (${reviews.length})`}>
            <div className="bg-white p-4 rounded-bottom shadow-sm">
              {/* Write Review Form */}
              {user ? (
                <div className="mb-5">
                  <h4 className="mb-3">Write a Review</h4>
                  <Form onSubmit={handleReviewSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Rating</Form.Label>
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
                              {reviewForm.rating === 1 && "Poor"}
                              {reviewForm.rating === 2 && "Fair"}
                              {reviewForm.rating === 3 && "Good"}
                              {reviewForm.rating === 4 && "Very Good"}
                              {reviewForm.rating === 5 && "Excellent"}
                            </span>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Comment</Form.Label>
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
                        placeholder="Share your thoughts about this product..."
                        required
                      />
                    </Form.Group>
                    <Button type="submit" disabled={reviewLoading}>
                      {reviewLoading ? "Submitting..." : "Submit Review"}
                    </Button>
                  </Form>
                  <hr className="my-4" />
                </div>
              ) : (
                <div className="text-center mb-4 p-4 bg-light rounded">
                  <p className="mb-2">Please log in to write a review</p>
                  <Link to="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">Customer Reviews</h4>
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
                          ({reviews.length} review
                          {reviews.length !== 1 ? "s" : ""})
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
                                    "Anonymous"}
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
                                    ).toLocaleDateString("en-US", {
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
                  <h5 className="fw-semibold">No reviews yet</h5>
                  <p className="text-secondary mb-4">
                    Be the first to review this product
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
