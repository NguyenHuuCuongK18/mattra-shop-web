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
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getAllProducts(),
          categoryAPI.getAllCategories(),
        ]);

        console.log("Products response:", productsResponse.data);
        console.log("Categories response:", categoriesResponse.data);

        // Normalize products: rename _id to id
        const normalizedProducts = productsResponse.data.products.map((p) => ({
          ...p,
          id: p._id,
        }));
        setProducts(normalizedProducts || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (err) {
        console.error(
          "Error fetching data:",
          err.response?.data || err.message
        );
        setError(
          "Failed to load products or categories. Please try again later."
        );
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      toast.success("Added to cart");
    } catch (err) {
      console.error("Error adding to cart:", err.response?.data || err.message);
      toast.error("Failed to add to cart");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
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
      <h1 className="mb-4">Our Products</h1>

      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </InputGroup>
        </Col>
        <Col md={6}>
          <Form.Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <h3>No products found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredProducts.map((product) => (
            <Col key={product.id}>
              <Card className="h-100">
                {product.imageUrl && (
                  <Card.Img
                    variant="top"
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-muted mb-2">
                    ${product.price.toFixed(2)}
                  </Card.Text>
                  <Card.Text className="mb-4">
                    {product.description
                      ? product.description.length > 100
                        ? `${product.description.substring(0, 100)}...`
                        : product.description
                      : "No description available"}
                  </Card.Text>
                  <div className="mt-auto d-flex justify-content-between">
                    <Button
                      as={Link}
                      to={`/product/${product.id}`}
                      variant="outline-primary"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </Card.Body>
                <Card.Footer className="text-muted">
                  {product.stock > 0 ? (
                    <small>{product.stock} in stock</small>
                  ) : (
                    <small className="text-danger">Out of stock</small>
                  )}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default ProductsPage;
