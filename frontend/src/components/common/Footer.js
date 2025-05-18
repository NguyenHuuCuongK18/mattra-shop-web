import { Link } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

function Footer() {
  return (
    <footer className="bg-dark text-white py-5">
      <Container>
        <Row className="gy-4">
          <Col md={6} lg={4}>
            <h2 className="fs-4 fw-bold mb-3">Mạt Trà</h2>
            <p className="text-secondary mb-3">
              Premium tea products for tea enthusiasts. Discover the finest
              selection of teas from around the world.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-secondary fs-5">
                <i className="bi bi-facebook"></i>
                <span className="visually-hidden">Facebook</span>
              </a>
              <a href="#" className="text-secondary fs-5">
                <i className="bi bi-instagram"></i>
                <span className="visually-hidden">Instagram</span>
              </a>
              <a href="#" className="text-secondary fs-5">
                <i className="bi bi-twitter"></i>
                <span className="visually-hidden">Twitter</span>
              </a>
            </div>
          </Col>
          <Col md={6} lg={2}>
            <h3 className="fs-6 text-secondary text-uppercase mb-3">
              Products
            </h3>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link
                  to="/products"
                  className="text-secondary text-decoration-none"
                >
                  All Products
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/products?category=green-tea"
                  className="text-secondary text-decoration-none"
                >
                  Green Tea
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/products?category=black-tea"
                  className="text-secondary text-decoration-none"
                >
                  Black Tea
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/products?category=herbal-tea"
                  className="text-secondary text-decoration-none"
                >
                  Herbal Tea
                </Link>
              </li>
            </ul>
          </Col>
          <Col md={6} lg={2}>
            <h3 className="fs-6 text-secondary text-uppercase mb-3">Company</h3>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link
                  to="/about"
                  className="text-secondary text-decoration-none"
                >
                  About
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/contact"
                  className="text-secondary text-decoration-none"
                >
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/terms"
                  className="text-secondary text-decoration-none"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/privacy"
                  className="text-secondary text-decoration-none"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </Col>
          <Col md={6} lg={4}>
            <h3 className="fs-6 text-secondary text-uppercase mb-3">
              Newsletter
            </h3>
            <p className="text-secondary mb-3">
              Subscribe to our newsletter for updates and promotions.
            </p>
            <form className="d-flex">
              <input
                type="email"
                className="form-control"
                placeholder="Your email"
              />
              <button type="submit" className="btn btn-success ms-2">
                Subscribe
              </button>
            </form>
          </Col>
        </Row>
        <div className="border-top border-secondary pt-4 mt-4 text-center text-secondary">
          <p>&copy; {new Date().getFullYear()} Mạt Trà. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
