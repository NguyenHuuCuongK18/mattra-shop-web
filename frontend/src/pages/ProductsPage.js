// src/pages/ProductsPage.js
"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Spinner,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { productAPI, categoryAPI } from "../utils/api";
import { useCart } from "../contexts/CartContext";
import { toast } from "react-hot-toast";

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getAllProducts(),
          categoryAPI.getAllCategories(),
        ]);

        // Chuẩn hóa products: đổi _id thành id
        const normalizedProducts = productsResponse.data.products.map((p) => ({
          ...p,
          id: p._id,
        }));
        setProducts(normalizedProducts || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (err) {
        console.error(
          "Lỗi khi tải dữ liệu:",
          err.response?.data || err.message
        );
        setError("Không thể tải sản phẩm hoặc danh mục. Vui lòng thử lại sau.");
        toast.error("Không thể tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      toast.success("Đã thêm vào giỏ hàng");
    } catch (err) {
      console.error(
        "Lỗi khi thêm vào giỏ hàng:",
        err.response?.data || err.message
      );
      toast.error("Thêm vào giỏ hàng thất bại");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      !selectedCategory ||
      product.categories?.name === selectedCategory ||
      product.categories?._id === selectedCategory ||
      product.categories === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="success" />
          <p className="mt-2 text-muted">Đang tải sản phẩm...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Tiêu đề & nút chuyển đổi grid/list */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold">Sản Phẩm</h1>
        <div className="d-flex gap-2">
          <Button
            variant={viewMode === "grid" ? "success" : "outline-success"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <i className="bi bi-grid-3x3-gap"></i>
          </Button>
          <Button
            variant={viewMode === "list" ? "success" : "outline-success"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <i className="bi bi-list"></i>
          </Button>
        </div>
      </div>

      {/* Thanh tìm kiếm & chọn danh mục */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text className="bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 bg-light"
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x"></i>
              </Button>
            )}
          </InputGroup>
        </Col>
        <Col md={6}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-light"
          >
            <option value="">Tất Cả Danh Mục</option>
            {categories.map((category) => (
              <option
                key={category._id || category.id}
                value={category._id || category.id}
              >
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* Hiển thị số lượng sản phẩm và nút xóa bộ lọc */}
      {(searchTerm || selectedCategory) && (
        <div className="mb-3">
          <small className="text-muted">
            Hiển thị {filteredProducts.length} sản phẩm
            {selectedCategory &&
              ` trong danh mục "${
                categories.find((c) => (c._id || c.id) === selectedCategory)
                  ?.name
              }"`}
            {searchTerm && ` khớp với "${searchTerm}"`}
          </small>
          <Button
            variant="link"
            size="sm"
            className="ms-2 p-0"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
            }}
          >
            Xóa bộ lọc
          </Button>
        </div>
      )}

      {/* Nếu không có sản phẩm thỏa điều kiện */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-search display-1 text-muted"></i>
          <h3 className="mt-3">Không tìm thấy sản phẩm</h3>
          <p className="text-muted">
            {searchTerm || selectedCategory
              ? "Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc"
              : "Không có sản phẩm nào vào lúc này"}
          </p>
          {(searchTerm || selectedCategory) && (
            <Button
              variant="outline-success"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        // ======== GRID VIEW ========
        <Row xs={1} md={2} lg={3} xl={4} className="g-4">
          {filteredProducts.map((product) => (
            <Col key={product.id}>
              <Card className="h-100 shadow-sm border-0 product-card">
                <div
                  className="position-relative overflow-hidden"
                  style={{ height: "250px" }}
                >
                  <Card.Img
                    variant="top"
                    src={
                      product.image || "/placeholder.svg?height=250&width=300"
                    }
                    alt={product.name}
                    className="w-100 h-100 object-fit-cover"
                    style={{ transition: "transform 0.3s ease" }}
                  />
                  {product.isFeatured && (
                    <Badge
                      bg="warning"
                      className="position-absolute top-0 start-0 m-2"
                    >
                      <i className="bi bi-star-fill me-1"></i>
                      Nổi Bật
                    </Badge>
                  )}
                  {product.stock <= 0 && (
                    <div className="position-absolute top-0 end-0 bg-danger text-white px-2 py-1 m-2 rounded">
                      Hết Hàng
                    </div>
                  )}
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="h5 mb-2">{product.name}</Card.Title>
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
                  <Card.Text className="text-muted small mb-3 flex-grow-1">
                    {product.description
                      ? product.description.length > 100
                        ? `${product.description.substring(0, 100)}...`
                        : product.description
                      : "Không có mô tả"}
                  </Card.Text>
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">
                        {product.stock > 0 ? (
                          <span className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {product.stock} sản phẩm có sẵn
                          </span>
                        ) : (
                          <span className="text-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            Hết hàng
                          </span>
                        )}
                      </small>
                    </div>
                    <div className="d-grid gap-2">
                      <Button
                        as={Link}
                        to={`/products/${product.id}`}
                        variant="outline-success"
                        size="sm"
                      >
                        Xem Chi Tiết
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock > 0 ? (
                          <>
                            <i className="bi bi-cart-plus me-1"></i>
                            Thêm vào Giỏ hàng
                          </>
                        ) : (
                          "Hết hàng"
                        )}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        // ======== LIST VIEW ========
        <div className="d-flex flex-column gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="shadow-sm border-0">
              <Row className="g-0">
                <Col md={3}>
                  <div style={{ height: "200px" }} className="overflow-hidden">
                    <Card.Img
                      src={
                        product.image || "/placeholder.svg?height=200&width=300"
                      }
                      alt={product.name}
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                </Col>
                <Col md={9}>
                  <Card.Body className="d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="h4 mb-0">
                        {product.name}
                      </Card.Title>
                      <div className="d-flex gap-2">
                        {product.isFeatured && (
                          <Badge bg="warning">
                            <i className="bi bi-star-fill me-1"></i>
                            Nổi Bật
                          </Badge>
                        )}
                        {product.categories?.name && (
                          <Badge bg="light" text="dark">
                            {product.categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="h4 text-success fw-bold">
                        {product.price.toLocaleString("vi-VN")} VND
                      </span>
                      <small className="text-muted ms-2">
                        {product.stock > 0 ? (
                          <span className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            {product.stock} sản phẩm có sẵn
                          </span>
                        ) : (
                          <span className="text-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            Hết hàng
                          </span>
                        )}
                      </small>
                    </div>
                    <Card.Text className="text-muted mb-3 flex-grow-1">
                      {product.description || "Không có mô tả"}
                    </Card.Text>
                    <div className="d-flex gap-2">
                      <Button
                        as={Link}
                        to={`/products/${product.id}`}
                        variant="outline-success"
                      >
                        Xem Chi Tiết
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={product.stock <= 0}
                      >
                        {product.stock > 0 ? (
                          <>
                            <i className="bi bi-cart-plus me-1"></i>
                            Thêm vào Giỏ hàng
                          </>
                        ) : (
                          "Hết hàng"
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default ProductsPage;
