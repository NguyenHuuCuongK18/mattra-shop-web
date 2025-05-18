"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card as BootstrapCard,
  Carousel,
} from "react-bootstrap";
import api from "../utils/api";
import Button from "../components/ui/Button";

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get("/api/product");
        setFeaturedProducts(response.data.products.slice(0, 4));
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
              <Link to="/products">
                <Button size="lg">Shop Now</Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Featured Products */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="fs-1 fw-bold">Featured Products</h2>
          <p className="lead text-secondary">
            Check out our most popular tea selections
          </p>
        </div>

        {loading ? (
          <Row>
            {[...Array(4)].map((_, index) => (
              <Col key={index} sm={6} lg={3} className="mb-4">
                <div className="placeholder-glow">
                  <div
                    className="placeholder w-100"
                    style={{ height: "200px" }}
                  ></div>
                  <div className="placeholder w-75 mt-3"></div>
                  <div className="placeholder w-50 mt-2"></div>
                  <div className="placeholder w-25 mt-3"></div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <Row>
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Col key={product.id} sm={6} lg={3} className="mb-4">
                  <BootstrapCard className="h-100 shadow-sm">
                    <BootstrapCard.Img
                      variant="top"
                      src={
                        product.imageUrl ||
                        "https://images.unsplash.com/photo-1523920290228-4f321a939b4c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                      }
                      alt={product.name}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <BootstrapCard.Body className="d-flex flex-column">
                      <BootstrapCard.Title>{product.name}</BootstrapCard.Title>
                      <BootstrapCard.Text className="text-secondary small flex-grow-1">
                        {product.description.substring(0, 80)}...
                      </BootstrapCard.Text>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="fs-5 fw-bold text-success">
                          ${product.price.toFixed(2)}
                        </span>
                        <Link to={`/products/${product.id}`}>
                          <Button variant="outline">View Details</Button>
                        </Link>
                      </div>
                    </BootstrapCard.Body>
                  </BootstrapCard>
                </Col>
              ))
            ) : (
              <Col className="text-center py-5">
                <p className="text-secondary">No products found</p>
              </Col>
            )}
          </Row>
        )}

        <div className="text-center mt-4">
          <Link to="/products">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>
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
