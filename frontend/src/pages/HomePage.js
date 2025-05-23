"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card as BootstrapCard,
  Carousel,
  Badge,
} from "react-bootstrap";
import { productAPI } from "../utils/api";
import Button from "../components/ui/Button";

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await productAPI.getAllProducts();
        // Filter only featured products and normalize IDs
        const featured = response.data.products
          .filter((product) => product.isFeatured)
          .map((product) => ({ ...product, id: product._id }))
          .slice(0, 8); // Show up to 8 featured products
        setFeaturedProducts(featured);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="position-relative bg-dark text-white">
        <div className="position-absolute w-100 h-100" style={{ zIndex: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1534278931827-8a259344abe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Tea"
            className="w-100 h-100 object-fit-cover"
            style={{ opacity: 0.4 }}
          />
        </div>
        <Container className="position-relative py-5" style={{ zIndex: 1 }}>
          <Row className="py-5">
            <Col lg={8} className="py-5">
              <h1 className="display-4 fw-bold mb-4">Mạt Trà</h1>
              <p className="lead mb-4">
                Discover the finest selection of premium teas from around the
                world. From traditional blends to unique flavors, we have
                something for every tea enthusiast.
              </p>
              <div className="d-flex gap-3">
                <Link to="/products">
                  <Button size="lg">Shop Now</Button>
                </Link>
                <Link to="/subscriptions">
                  <Button variant="outline" size="lg" className="bg-white">
                    Learn More
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Featured Products */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="fs-1 fw-bold">Featured Products</h2>
          <p className="lead text-secondary">
            Check out our handpicked premium tea selections
          </p>
        </div>

        {loading ? (
          <Row>
            {[...Array(4)].map((_, index) => (
              <Col key={index} sm={6} lg={3} className="mb-4">
                <div className="placeholder-glow">
                  <div
                    className="placeholder w-100 rounded"
                    style={{ height: "250px" }}
                  ></div>
                  <div className="placeholder w-75 mt-3"></div>
                  <div className="placeholder w-50 mt-2"></div>
                  <div className="placeholder w-25 mt-3"></div>
                </div>
              </Col>
            ))}
          </Row>
        ) : featuredProducts.length > 0 ? (
          <>
            <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
              {featuredProducts.map((product) => (
                <Col key={product.id}>
                  <BootstrapCard className="h-100 shadow-sm border-0 product-card">
                    <div
                      className="position-relative overflow-hidden"
                      style={{ height: "250px" }}
                    >
                      <BootstrapCard.Img
                        variant="top"
                        src={
                          product.image ||
                          "/placeholder.svg?height=250&width=300"
                        }
                        alt={product.name}
                        className="w-100 h-100 object-fit-cover"
                        style={{ transition: "transform 0.3s ease" }}
                      />
                      <Badge
                        bg="warning"
                        className="position-absolute top-0 start-0 m-2"
                      >
                        <i className="bi bi-star-fill me-1"></i>
                        Featured
                      </Badge>
                      {product.stock <= 0 && (
                        <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 m-2 rounded">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <BootstrapCard.Body className="d-flex flex-column">
                      <BootstrapCard.Title className="h5 mb-2">
                        {product.name}
                      </BootstrapCard.Title>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="h5 text-success fw-bold mb-0">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.categories?.name && (
                          <Badge bg="light" text="dark" className="px-2 py-1">
                            {product.categories.name}
                          </Badge>
                        )}
                      </div>
                      <BootstrapCard.Text className="text-secondary small flex-grow-1 mb-3">
                        {product.description
                          ? product.description.length > 80
                            ? `${product.description.substring(0, 80)}...`
                            : product.description
                          : "Premium quality tea"}
                      </BootstrapCard.Text>
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">
                            {product.stock > 0 ? (
                              <span className="text-success">
                                <i className="bi bi-check-circle me-1"></i>
                                In Stock
                              </span>
                            ) : (
                              <span className="text-danger">
                                <i className="bi bi-x-circle me-1"></i>
                                Out of Stock
                              </span>
                            )}
                          </small>
                        </div>
                        <Link to={`/products/${product.id}`} className="w-100">
                          <Button variant="outline" className="w-100">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </BootstrapCard.Body>
                  </BootstrapCard>
                </Col>
              ))}
            </Row>
            <div className="text-center mt-5">
              <Link to="/products">
                <Button variant="outline" size="lg">
                  View All Products
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-5 bg-light rounded">
            <i className="bi bi-star display-1 text-muted"></i>
            <h3 className="mt-3">No Featured Products</h3>
            <p className="text-muted mb-4">
              Featured products will appear here once they are added by
              administrators
            </p>
            <Link to="/products">
              <Button variant="outline">Browse All Products</Button>
            </Link>
          </div>
        )}
      </Container>

      {/* Features Section */}
      <div className="bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fs-1 fw-bold">Why Choose Mạt Trà?</h2>
            <p className="lead text-secondary">
              We are committed to providing the highest quality tea products and
              exceptional customer service.
            </p>
          </div>
          <Row>
            <Col md={4} className="mb-4">
              <div className="bg-white p-4 rounded shadow-sm text-center h-100">
                <div
                  className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-check-circle fs-1 text-success"></i>
                </div>
                <h3 className="fs-4 fw-semibold mb-3">Premium Quality</h3>
                <p className="text-secondary mb-0">
                  We source our teas directly from trusted farmers and suppliers
                  to ensure the highest quality.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="bg-white p-4 rounded shadow-sm text-center h-100">
                <div
                  className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-truck fs-1 text-success"></i>
                </div>
                <h3 className="fs-4 fw-semibold mb-3">Fast Delivery</h3>
                <p className="text-secondary mb-0">
                  We offer quick and reliable shipping to ensure your tea
                  arrives fresh and on time.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="bg-white p-4 rounded shadow-sm text-center h-100">
                <div
                  className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i className="bi bi-headset fs-1 text-success"></i>
                </div>
                <h3 className="fs-4 fw-semibold mb-3">Expert Advice</h3>
                <p className="text-secondary mb-0">
                  Our tea experts are available to help you find the perfect tea
                  for your taste preferences.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Testimonials */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="fs-1 fw-bold">What Our Customers Say</h2>
          <p className="lead text-secondary">
            Hear from our satisfied tea enthusiasts
          </p>
        </div>

        <Carousel indicators={false} className="bg-light rounded p-4 shadow-sm">
          <Carousel.Item>
            <div className="text-center px-md-5 py-3">
              <p className="fs-5 fst-italic mb-4">
                "The quality of teas from Mạt Trà is exceptional. I've been a
                customer for years and have never been disappointed."
              </p>
              <div className="d-flex justify-content-center align-items-center">
                <div
                  className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "50px", height: "50px" }}
                >
                  <span className="text-white fw-bold">JD</span>
                </div>
                <div className="text-start">
                  <h5 className="mb-0">John Doe</h5>
                  <p className="text-secondary mb-0">Tea Enthusiast</p>
                </div>
              </div>
            </div>
          </Carousel.Item>
          <Carousel.Item>
            <div className="text-center px-md-5 py-3">
              <p className="fs-5 fst-italic mb-4">
                "I love the variety of teas available. The customer service is
                also top-notch!"
              </p>
              <div className="d-flex justify-content-center align-items-center">
                <div
                  className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "50px", height: "50px" }}
                >
                  <span className="text-white fw-bold">JS</span>
                </div>
                <div className="text-start">
                  <h5 className="mb-0">Jane Smith</h5>
                  <p className="text-secondary mb-0">Regular Customer</p>
                </div>
              </div>
            </div>
          </Carousel.Item>
        </Carousel>
      </Container>

      {/* Subscription CTA */}
      <div className="bg-success text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="fs-1 fw-bold">
                Ready to dive into the world of premium tea?
              </h2>
              <p className="lead">Subscribe to our tea club today.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Link to="/subscriptions">
                <Button
                  variant="secondary"
                  size="lg"
                  className="me-2 mb-2 mb-md-0"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg" className="bg-white">
                  Learn More
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default HomePage;
