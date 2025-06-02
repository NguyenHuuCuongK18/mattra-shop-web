// src/components/Footer.js
import { Link } from "react-router-dom";
import { Container, Row, Col, Alert } from "react-bootstrap";

function Footer() {
  return (
    <footer className="bg-dark text-white py-5">
      <Container>
        <Row className="gy-4">
          {/* Chân trang Mạt Trà */}
          <Col md={6} lg={4}>
            <h2 className="fs-4 fw-bold mb-3">Mạt Trà</h2>
            <p className="text-secondary mb-3">
              Sản phẩm trà cao cấp dành cho những người yêu trà. Khám phá tuyển
              chọn những loại trà tinh túy từ khắp nơi.
            </p>
            <div className="d-flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61576949481579"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary fs-5"
              >
                <i className="bi bi-facebook"></i>
                <span className="visually-hidden">Facebook</span>
              </a>
            </div>
          </Col>

          {/* Sản phẩm */}
          <Col md={6} lg={2}>
            <h3 className="fs-6 text-secondary text-uppercase mb-3">
              Sản phẩm
            </h3>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link
                  to="/products"
                  className="text-secondary text-decoration-none"
                >
                  Tất cả sản phẩm
                </Link>
              </li>
            </ul>
          </Col>

          {/* Công ty */}
          <Col md={6} lg={2}>
            <h3 className="fs-6 text-secondary text-uppercase mb-3">Công ty</h3>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="#" className="text-secondary text-decoration-none">
                  Giới thiệu
                </Link>
              </li>
              <li className="mb-2">
                <Link to="#" className="text-secondary text-decoration-none">
                  Liên hệ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="#" className="text-secondary text-decoration-none">
                  Điều khoản & Điều kiện
                </Link>
              </li>
              <li className="mb-2">
                <Link to="#" className="text-secondary text-decoration-none">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </Col>

          {/* Đăng ký nhận tin & Liên hệ qua Facebook */}
          <Col md={6} lg={4}>
            <h3 className="fs-6 text-secondary text-uppercase mb-3">
              Đăng ký tin
            </h3>
            <p className="text-secondary mb-3">
              Đăng ký nhận bản tin để cập nhật khuyến mãi và tin tức mới nhất.
            </p>
            <form className="d-flex mb-4">
              <input
                type="email"
                className="form-control"
                placeholder="Email của bạn"
              />
              <button type="submit" className="btn btn-success ms-2">
                Đăng ký
              </button>
            </form>

            <h3 className="fs-6 text-secondary text-uppercase mb-3">Liên hệ</h3>
            <p className="text-secondary mb-1">
              Theo dõi và nhắn tin cho chúng tôi trên Facebook:
            </p>
            <a
              href="https://www.facebook.com/profile.php?id=61576949481579"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary text-decoration-none"
            >
              <i className="bi bi-facebook me-2"></i>Mạt Trà trên Facebook
            </a>
          </Col>
        </Row>

        <div className="border-top border-secondary pt-4 mt-4 text-center text-secondary">
          <p>&copy; {new Date().getFullYear()} Mạt Trà. Bảo lưu mọi quyền.</p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
