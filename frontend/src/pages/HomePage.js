// src/pages/HomePage.js
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
      {/* =========================
          Hero Section — TWO COLUMNS
          ========================= */}
      <div className="position-relative">
        <Row className="w-100 m-0 p-0 vh-100 bg-dark text-white">
          {/* LEFT COLUMN: Logo + Brand Story */}
          <Col
            md={6}
            className="d-flex flex-column justify-content-center align-items-start px-5"
            style={{
              zIndex: 1,
              background:
                "rgba(0, 0, 0, 0.6)" /* slight overlay so text is readable */,
            }}
          >
            {/* Logo */}
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="Mạt Trà Logo"
                style={{ width: "60px", height: "60px" }}
              />
            </div>

            {/* Main Heading */}
            <h1 className="display-4 fw-bold mb-4">
              MẠT TRÀ VÀ NHỮNG ĐIỀU KHÁC BIỆT
            </h1>

            {/* Subheading */}
            <h3 className="fw-semibold mb-3">Câu Chuyện Thương Hiệu Mạt Trà</h3>

            {/* Paragraphs */}
            <p className="mb-3">
              Trong nhịp sống hiện đại, giới trẻ ngày càng quan tâm đến sức khỏe
              và cân bằng dinh dưỡng, nhưng cũng không muốn bỏ lỡ nguồn năng
              lượng và sự tỉnh táo để luôn bắt kịp cuộc sống sôi động. Hiểu được
              điều đó, Mạt Trà ra đời như một sự thay thế hoàn hảo và lành mạnh
              hơn so với cà phê truyền thống.
            </p>
            <p className="mb-3">
              Tại Mạt Trà, chúng tôi tin rằng năng lượng khỏe mạnh đến từ những
              lựa chọn tự nhiên và cân bằng. Được tuyển chọn kỹ lưỡng từ những
              lá trà xanh Nhật Bản cao cấp, mỗi ly matcha của Mạt Trà không chỉ
              giúp bạn tỉnh táo mà còn bổ sung chất chống oxy hóa, hỗ trợ quá
              trình giảm cân và giữ dáng hiệu quả.
            </p>
            <p>
              Mạt Trà tự hào là người bạn đồng hành lý tưởng cho các bạn trẻ
              năng động, sáng tạo và luôn hướng đến phong cách sống lành mạnh.
              Hãy để Mạt Trà là nguồn cảm hứng mỗi ngày, giúp bạn đạt được phiên
              bản tốt nhất của chính mình.
            </p>
          </Col>

          {/* RIGHT COLUMN: Hero Image */}
          <Col md={6} className="p-0 position-relative">
            <img
              src="/HomePageImage.jpg"
              alt="Ly Matcha"
              className="w-100 h-100 object-fit-cover"
              style={{ objectFit: "cover" }}
            />
            {/* Optional: If you want a translucent dark overlay over the image, uncomment below */}
            {/*
            <div
              className="position-absolute top-0 bottom-0 start-0 end-0"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
            />
            */}
          </Col>
        </Row>
      </div>

      {/* ===================================
          Featured Products (with VND format)
          =================================== */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="fs-1 fw-bold">Sản Phẩm Nổi Bật</h2>
          <p className="lead text-secondary">
            Khám phá những lựa chọn matcha thượng hạng do chúng tôi tuyển chọn.
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
                        Nổi Bật
                      </Badge>
                      {product.stock <= 0 && (
                        <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 m-2 rounded">
                          Hết Hàng
                        </div>
                      )}
                    </div>
                    <BootstrapCard.Body className="d-flex flex-column">
                      <BootstrapCard.Title className="h5 mb-2">
                        {product.name}
                      </BootstrapCard.Title>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="h5 text-success fw-bold mb-0">
                          {product.price.toLocaleString("vi-VN")} VND
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
                          : "Chất lượng matcha thượng hạng"}
                      </BootstrapCard.Text>
                      <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">
                            {product.stock > 0 ? (
                              <span className="text-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Còn Hàng
                              </span>
                            ) : (
                              <span className="text-danger">
                                <i className="bi bi-x-circle me-1"></i>
                                Hết Hàng
                              </span>
                            )}
                          </small>
                        </div>
                        <Link to={`/products/${product.id}`} className="w-100">
                          <Button variant="outline" className="w-100">
                            Xem Chi Tiết
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
                  Xem Tất Cả Sản Phẩm
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-5 bg-light rounded">
            <i className="bi bi-star display-1 text-muted"></i>
            <h3 className="mt-3">Chưa có sản phẩm nổi bật</h3>
            <p className="text-muted mb-4">
              Sản phẩm nổi bật sẽ xuất hiện ở đây khi được thêm bởi quản trị
              viên
            </p>
            <Link to="/products">
              <Button variant="outline">Xem Tất Cả Sản Phẩm</Button>
            </Link>
          </div>
        )}
      </Container>

      {/* ============================
          Why Choose Mạt Trà? Section
          ============================ */}
      <div className="bg-light py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fs-1 fw-bold">Tại Sao Chọn Mạt Trà?</h2>
            <p className="lead text-secondary">
              Chúng tôi cam kết mang đến những sản phẩm matcha chất lượng nhất
              và dịch vụ tận tâm.
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
                <h3 className="fs-4 fw-semibold mb-3">
                  Chất Lượng Thượng Hạng
                </h3>
                <p className="text-secondary mb-0">
                  Chúng tôi lấy matcha trực tiếp từ những trang trại uy tín để
                  đảm bảo chất lượng tối ưu.
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
                <h3 className="fs-4 fw-semibold mb-3">Giao Hàng Nhanh Chóng</h3>
                <p className="text-secondary mb-0">
                  Giao hàng nhanh, đảm bảo matcha đến tay bạn luôn tươi ngon.
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
                <h3 className="fs-4 fw-semibold mb-3">Tư Vấn Chuyên Gia</h3>
                <p className="text-secondary mb-0">
                  Đội ngũ chuyên gia luôn sẵn sàng giúp bạn tìm ra loại matcha
                  phù hợp nhất.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* ===================
          Testimonials
          =================== */}
      <Container className="py-5">
        <div className="text-center mb-5">
          <h2 className="fs-1 fw-bold">Khách Hàng Nói Gì</h2>
          <p className="lead text-secondary">
            Nghe những phản hồi chân thực từ cộng đồng yêu matcha
          </p>
        </div>

        <Carousel indicators={false} className="bg-light rounded p-4 shadow-sm">
          <Carousel.Item>
            <div className="text-center px-md-5 py-3">
              <p className="fs-5 fst-italic mb-4">
                "Chất lượng matcha ở Mạt Trà thật tuyệt vời. Tôi đã là khách
                hàng suốt một năm qua và chưa bao giờ thất vọng."
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
                  <p className="text-secondary mb-0">Matcha Enthusiast</p>
                </div>
              </div>
            </div>
          </Carousel.Item>
          <Carousel.Item>
            <div className="text-center px-md-5 py-3">
              <p className="fs-5 fst-italic mb-4">
                "Tôi rất thích hương vị đa dạng của matcha tại đây. Dịch vụ
                khách hàng cũng rất chu đáo!"
              </p>
              <div className="d-flex justify-content-center align-items-center">
                <div
                  className="bg-success rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "50px", height: "50px" }}
                >
                  <span className="text-white fw-bold">VS</span>
                </div>
                <div className="text-start">
                  <h5 className="mb-0">Vân Sơn</h5>
                  <p className="text-secondary mb-0">Khách Hàng Thân Thiết</p>
                </div>
              </div>
            </div>
          </Carousel.Item>
        </Carousel>
      </Container>

      {/* ================================
          Subscription CTA (unchanged)
          ================================ */}
      <div className="bg-success text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mb-4 mb-lg-0">
              <h2 className="fs-1 fw-bold">
                Sẵn sàng bước vào thế giới matcha thượng hạng?
              </h2>
              <p className="lead">Đăng ký nhận ưu đãi hôm nay.</p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Link to="/subscriptions">
                <Button
                  variant="secondary"
                  size="lg"
                  className="me-2 mb-2 mb-md-0"
                >
                  Bắt Đầu
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg" className="bg-white">
                  Tìm Hiểu Thêm
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
